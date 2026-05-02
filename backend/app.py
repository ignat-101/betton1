from flask import Flask, jsonify, request, send_from_directory
import os
import json
import time
import hashlib
import secrets

app = Flask(__name__, static_folder='dist', static_url_path='')

# ============ CONFIG ============
# Read admin wallet and treasury wallet from environment for deployments
ADMIN_WALLET = os.environ.get('ADMIN_WALLET', 'UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0')
TREASURY_WALLET = os.environ.get('TREASURY_WALLET', ADMIN_WALLET)
DATA_FILE = 'data.json'

# ============ DATA LAYER ============
def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        'markets': [],
        'users': {},
        'transactions': [],
        'treasury': {'balance': 0, 'total_volume': 0},
        # disputes: list of dispute objects created when markets are contested
        'disputes': [],
        # payouts: withdrawal requests and their states
        'payouts': [],
        'deposits': [],
        # stakes: mapping address -> staked_amount (platform-internal staking pool)
        'stakes': {},
        'stake_transactions': []
    }


def fetch_usd_price(coin_id: str):
    """Return USD price for a given CoinGecko coin id or None on error."""
    try:
        import urllib.request
        url = f'https://api.coingecko.com/api/v3/simple/price?ids={coin_id}&vs_currencies=usd'
        req = urllib.request.Request(url, headers={'User-Agent': 'betton/1.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            j = json.loads(resp.read())
        return float(j.get(coin_id, {}).get('usd', 0))
    except Exception:
        return None


def ensure_hot_markets(data):
    """Create or refresh short 5-minute crypto markets for BTC/ETH/SOL/TON.
    These markets are oracle-resolved only.
    """
    now = int(time.time() * 1000)
    coins = [
        ('bitcoin', 'BTC'),
        ('ethereum', 'ETH'),
        ('solana', 'SOL'),
        ('the-open-network', 'TON')
    ]
    for coin_id, symbol in coins:
        # find active hot market for this coin
        hot = next((m for m in data['markets'] if m.get('meta', {}).get('hot') and m.get('meta', {}).get('coin') == coin_id and m['status'] == 'active'), None)
        if hot:
            # if expired, we'll resolve later when get_markets is called
            continue
        # create new hot market
        start_price = fetch_usd_price(coin_id) or 0
        market = {
            'id': f'hot-{coin_id}-{now}',
            'title': f'{symbol} 5m: рост или падение?',
            'description': f'Горячие 5-минутные ставки на {symbol} (oracle-only).',
            'category': 'crypto',
            'creator_address': '',
            'creator_name': 'oracle',
            'created_at': now,
            'end_date': now + 5*60*1000,
            'status': 'active',
            'oracle_type': 'crypto',
            'oracle_config': coin_id,
            'outcomes': {
                'yes': {'label': 'Выше', 'probability': 50, 'pool': 0},
                'no': {'label': 'Ниже', 'probability': 50, 'pool': 0}
            },
            'total_volume': 0,
            'voters': [],
            'resolution': None,
            'resolved_at': None,
            'meta': {'hot': True, 'coin': coin_id, 'start_price': start_price},
            'history': [{'t': now, 'yes': 50}]
        }
        data['markets'].append(market)
    save_data(data)

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ============ ROUTES ============

# Serve React TMA
@app.route('/')
def serve_index():
    return send_from_directory('dist', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join('dist', path)):
        return send_from_directory('dist', path)
    return send_from_directory('dist', 'index.html')

# ============ API: MARKETS ============

@app.route('/api/markets', methods=['GET'])
def get_markets():
    data = load_data()
    # ensure hot markets exist
    ensure_hot_markets(data)
    now = int(time.time() * 1000)
    # auto-resolve expired hot markets using oracle (price compare)
    for m in data['markets']:
        if m.get('meta', {}).get('hot') and m.get('status') == 'active' and m.get('end_date', 0) <= now:
            coin = m.get('meta', {}).get('coin')
            start_price = m.get('meta', {}).get('start_price', 0)
            current_price = fetch_usd_price(coin) or 0
            result = 'yes' if current_price > start_price else 'no'
            m['status'] = 'resolved'
            m['resolution'] = result
            m['resolved_at'] = now
            data['transactions'].append({'type': 'resolution', 'market_id': m['id'], 'result': result, 'resolved_by': 'oracle', 'timestamp': now})
            # record final history point
            if 'history' not in m: m['history'] = []
            m['history'].append({'t': now, 'yes': m['outcomes']['yes']['probability']})
    save_data(data)
    status = request.args.get('status')
    category = request.args.get('category')
    markets = data['markets']
    if status:
        markets = [m for m in markets if m['status'] == status]
    if category and category != 'all':
        markets = [m for m in markets if m['category'] == category]
    return jsonify({'markets': markets})

@app.route('/api/markets', methods=['POST'])
def create_market():
    data = load_data()
    body = request.json
    market = {
        'id': secrets.token_hex(8),
        'title': body.get('title', ''),
        'description': body.get('description', ''),
        'category': body.get('category', 'other'),
        'creator_address': body.get('creator_address', ''),
        'creator_name': body.get('creator_name', 'anonymous'),
        'created_at': int(time.time() * 1000),
        'end_date': body.get('end_date', 0),
        'status': 'active',
        'oracle_type': body.get('oracle_type', 'manual'),
        'oracle_config': body.get('oracle_config', ''),
        'outcomes': {
            'yes': {'label': 'Да', 'probability': 50, 'pool': 0},
            'no': {'label': 'Нет', 'probability': 50, 'pool': 0}
        },
        'total_volume': 0,
        'voters': [],
        'resolution': None,
        'resolved_at': None,
        'history': [{'t': int(time.time() * 1000), 'yes': 50}]
    }
    data['markets'].append(market)
    save_data(data)
    return jsonify({'ok': True, 'market': market})

@app.route('/api/markets/<market_id>', methods=['GET'])
def get_market(market_id):
    data = load_data()
    market = next((m for m in data['markets'] if m['id'] == market_id), None)
    if not market:
        return jsonify({'error': 'Market not found'}), 404
    return jsonify({'market': market})

@app.route('/api/markets/<market_id>/bet', methods=['POST'])
def place_bet(market_id):
    data = load_data()
    body = request.json
    market = next((m for m in data['markets'] if m['id'] == market_id), None)
    if not market:
        return jsonify({'error': 'Market not found'}), 404
    if market['status'] != 'active':
        return jsonify({'error': 'Market is not active'}), 400

    outcome = body.get('outcome')  # 'yes' or 'no'
    amount = body.get('amount', 0)
    user_address = body.get('user_address', '')

    if outcome not in ('yes', 'no'):
        return jsonify({'error': 'Invalid outcome'}), 400
    if amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400

    # Ensure user exists and has sufficient balance (balance stored in USDT equivalent)
    ensure_user(data, user_address)
    user_balance = float(data['users'][user_address].get('balance', 0))
    if amount > user_balance:
        return jsonify({'error': 'Insufficient balance'}), 400

    # Update pool
    market['outcomes'][outcome]['pool'] += amount
    market['total_volume'] = market['outcomes']['yes']['pool'] + market['outcomes']['no']['pool']

    # Deduct user balance
    data['users'][user_address]['balance'] = round(user_balance - amount, 8)

    # Recalculate probabilities
    yes_pool = market['outcomes']['yes']['pool']
    total = market['outcomes']['yes']['pool'] + market['outcomes']['no']['pool']
    market['outcomes']['yes']['probability'] = round((yes_pool / total) * 100) if total > 0 else 50
    market['outcomes']['no']['probability'] = 100 - market['outcomes']['yes']['probability']

    # Append history point for probability chart
    if 'history' not in market:
        market['history'] = []
    market['history'].append({'t': int(time.time() * 1000), 'yes': market['outcomes']['yes']['probability']})

    # Record transaction
    data['transactions'].append({
        'type': 'bet',
        'market_id': market_id,
        'user_address': user_address,
        'outcome': outcome,
        'amount': amount,
        'timestamp': int(time.time() * 1000)
    })

    # Update treasury (5% fee)
    fee = amount * 0.05
    data['treasury']['balance'] += fee
    data['treasury']['total_volume'] += amount

    # Referral handling: optional referrer gets small reward (1% of bet amount)
    referrer = body.get('referrer')
    if referrer and referrer != user_address:
        referral_reward = round(amount * 0.01, 8)
        # ensure referrer user exists
        if referrer not in data['users']:
            data['users'][referrer] = {
                'address': referrer,
                'name': 'referrer',
                'balance': 0,
                'reputation': 50,
                'total_bets': 0,
                'wins': 0,
                'losses': 0,
                'referralCode': None,
                'referrals': 0,
                'referralEarnings': 0,
                'is_admin': referrer == ADMIN_WALLET
            }
        data['users'][referrer]['referrals'] = data['users'][referrer].get('referrals', 0) + 1
        data['users'][referrer]['referralEarnings'] = round(data['users'][referrer].get('referralEarnings', 0) + referral_reward, 8)
        data['users'][referrer]['balance'] = round(data['users'][referrer].get('balance', 0) + referral_reward, 8)
        data['transactions'].append({'type': 'referral', 'from': user_address, 'to': referrer, 'amount': referral_reward, 'timestamp': int(time.time() * 1000)})

    save_data(data)
    return jsonify({'ok': True, 'market': market})

# ============ API: VOTING ============

@app.route('/api/markets/<market_id>/vote', methods=['POST'])
def vote_on_market(market_id):
    data = load_data()
    body = request.json
    market = next((m for m in data['markets'] if m['id'] == market_id), None)
    if not market:
        return jsonify({'error': 'Market not found'}), 404
    if market['status'] not in ('active', 'voting'):
        return jsonify({'error': 'Market cannot be voted on'}), 400

    voter = {
        'address': body.get('user_address', ''),
        'name': body.get('user_name', 'anonymous'),
        'vote': body.get('vote'),  # 'yes' or 'no'
        'stake': body.get('stake', 100),
        'timestamp': int(time.time() * 1000)
    }
    market['voters'].append(voter)
    market['status'] = 'voting'
    save_data(data)
    return jsonify({'ok': True, 'voters': market['voters']})

# ============ API: ADMIN RESOLVE ============

@app.route('/api/markets/<market_id>/resolve', methods=['POST'])
def resolve_market(market_id):
    data = load_data()
    body = request.json
    admin_address = body.get('admin_address', '')

    if admin_address != ADMIN_WALLET:
        return jsonify({'error': 'Unauthorized. Admin only.'}), 403

    market = next((m for m in data['markets'] if m['id'] == market_id), None)
    if not market:
        return jsonify({'error': 'Market not found'}), 404

    result = body.get('result')  # 'yes' or 'no'
    if result not in ('yes', 'no'):
        return jsonify({'error': 'Invalid result'}), 400

    market['status'] = 'resolved'
    market['resolution'] = result
    market['resolved_at'] = int(time.time() * 1000)

    # Record transaction
    data['transactions'].append({
        'type': 'resolution',
        'market_id': market_id,
        'result': result,
        'resolved_by': admin_address,
        'timestamp': market['resolved_at']
    })

    save_data(data)
    return jsonify({'ok': True, 'market': market})

# ============ API: DISPUTES & STAKING ============

def find_dispute(data, dispute_id):
    return next((d for d in data.get('disputes', []) if d['id'] == dispute_id), None)


@app.route('/api/disputes', methods=['GET'])
def list_disputes():
    data = load_data()
    return jsonify({'disputes': data.get('disputes', [])})


@app.route('/api/disputes', methods=['POST'])
def create_dispute():
    data = load_data()
    body = request.json
    # Simplified dispute creation: only question/title, expires_at and description
    # Keep other fields minimal; creator optional
    dispute = {
        'id': secrets.token_hex(8),
        'title': body.get('title') or body.get('question') or 'Спор',
        'description': body.get('description') or body.get('reason') or '',
        'creator': body.get('creator', ''),
        'created_at': int(time.time() * 1000),
        'expires_at': int(body.get('expires_at', 0)) or int(time.time() * 1000) + 24*3600*1000,
        'status': 'open',
        # votes: list of {address, vote: 'yes'|'no', stake, timestamp}
        'votes': [],
        'resolved_at': None,
        'result': None
    }
    data['disputes'].append(dispute)
    save_data(data)
    return jsonify({'ok': True, 'dispute': dispute})


@app.route('/api/disputes/<dispute_id>/vote', methods=['POST'])
def vote_dispute(dispute_id):
    data = load_data()
    body = request.json
    dispute = find_dispute(data, dispute_id)
    if not dispute:
        return jsonify({'error': 'Dispute not found'}), 404
    if dispute['status'] != 'open':
        return jsonify({'error': 'Dispute is not open for voting'}), 400

    address = body.get('user_address', '')
    vote = body.get('vote')  # 'yes' or 'no'
    stake_amount = float(body.get('stake', 0))
    if vote not in ('yes', 'no'):
        return jsonify({'error': 'Invalid vote'}), 400
    if stake_amount <= 0:
        return jsonify({'error': 'Invalid stake amount'}), 400

    # Ensure user has staked funds in platform pool
    user_stake = data.get('stakes', {}).get(address, 0)
    if user_stake < stake_amount:
        return jsonify({'error': 'Insufficient staked balance. Stake first via /api/stake'}), 400

    # Record vote and lock the stake (we deduct from available in stakes and keep locked in dispute)
    vote_entry = {
        'address': address,
        'vote': vote,
        'stake': stake_amount,
        'timestamp': int(time.time() * 1000)
    }
    dispute['votes'].append(vote_entry)

    # subtract from available stake
    data['stakes'][address] = round(data['stakes'].get(address, 0) - stake_amount, 8)
    data['stake_transactions'].append({'type': 'lock', 'address': address, 'amount': stake_amount, 'dispute_id': dispute_id, 'timestamp': int(time.time() * 1000)})

    save_data(data)
    return jsonify({'ok': True, 'dispute': dispute})


@app.route('/api/disputes/<dispute_id>/resolve', methods=['POST'])
def resolve_dispute(dispute_id):
    data = load_data()
    body = request.json
    admin_address = body.get('admin_address', '')
    dispute = find_dispute(data, dispute_id)
    if not dispute:
        return jsonify({'error': 'Dispute not found'}), 404
    if dispute['status'] != 'open':
        return jsonify({'error': 'Dispute already resolved'}), 400

    # Allow admin to resolve or auto-resolve if one side holds >66% of stake
    # compute stakes per side
    yes_total = sum(v['stake'] for v in dispute['votes'] if v['vote'] == 'yes')
    no_total = sum(v['stake'] for v in dispute['votes'] if v['vote'] == 'no')
    total = yes_total + no_total
    auto_winner = None
    if total > 0:
        if yes_total / total >= 0.66:
            auto_winner = 'yes'
        elif no_total / total >= 0.66:
            auto_winner = 'no'

    result = None
    if auto_winner:
        result = auto_winner
    else:
        if admin_address != ADMIN_WALLET:
            return jsonify({'error': 'Unauthorized. Admin only to resolve this dispute.'}), 403
        result = body.get('result')
        if result not in ('yes', 'no'):
            return jsonify({'error': 'Invalid result'}), 400

    # distribute locked stakes: losing stakes go to winning voters proportional to their stake (10% fee to treasury)
    winning = result
    losing = 'no' if winning == 'yes' else 'yes'
    winning_votes = [v for v in dispute['votes'] if v['vote'] == winning]
    losing_total = sum(v['stake'] for v in dispute['votes'] if v['vote'] == losing)

    fee = round(losing_total * 0.10, 8)
    reward_pool = round(losing_total - fee, 8)
    data['treasury']['balance'] += fee

    # distribute reward_pool to winning voters proportionally
    if winning_votes and reward_pool > 0:
        total_winning_stake = sum(v['stake'] for v in winning_votes)
        for v in winning_votes:
            share = (v['stake'] / total_winning_stake) if total_winning_stake > 0 else 0
            reward = round(reward_pool * share, 8)
            data['stakes'][v['address']] = round(data['stakes'].get(v['address'], 0) + v['stake'] + reward, 8)
            data['stake_transactions'].append({'type': 'reward_unlocked', 'address': v['address'], 'amount': v['stake'] + reward, 'dispute_id': dispute_id, 'timestamp': int(time.time() * 1000)})
    else:
        # no winners: unlock stakes back to their owners
        for v in dispute['votes']:
            data['stakes'][v['address']] = round(data['stakes'].get(v['address'], 0) + v['stake'], 8)
            data['stake_transactions'].append({'type': 'unlock', 'address': v['address'], 'amount': v['stake'], 'dispute_id': dispute_id, 'timestamp': int(time.time() * 1000)})

    dispute['status'] = 'resolved'
    dispute['result'] = result
    dispute['resolved_at'] = int(time.time() * 1000)

    data['transactions'].append({'type': 'dispute_resolution', 'dispute_id': dispute_id, 'result': result, 'resolved_by': admin_address or 'auto', 'timestamp': dispute['resolved_at']})

    save_data(data)
    return jsonify({'ok': True, 'dispute': dispute})


@app.route('/api/stake', methods=['POST'])
def stake():
    data = load_data()
    body = request.json
    address = body.get('user_address')
    amount = float(body.get('amount', 0))
    if not address or amount <= 0:
        return jsonify({'error': 'Invalid stake request'}), 400

    data['stakes'][address] = round(data['stakes'].get(address, 0) + amount, 8)
    data['stake_transactions'].append({'type': 'stake', 'address': address, 'amount': amount, 'timestamp': int(time.time() * 1000)})
    save_data(data)
    return jsonify({'ok': True, 'staked': data['stakes'][address]})


@app.route('/api/unstake', methods=['POST'])
def unstake():
    data = load_data()
    body = request.json
    address = body.get('user_address')
    amount = float(body.get('amount', 0))
    if not address or amount <= 0:
        return jsonify({'error': 'Invalid unstake request'}), 400
    available = data['stakes'].get(address, 0)
    if amount > available:
        return jsonify({'error': 'Insufficient staked balance'}), 400
    data['stakes'][address] = round(available - amount, 8)
    data['stake_transactions'].append({'type': 'unstake', 'address': address, 'amount': amount, 'timestamp': int(time.time() * 1000)})
    save_data(data)
    return jsonify({'ok': True, 'staked': data['stakes'][address]})


@app.route('/api/stake/<address>', methods=['GET'])
def get_stake(address):
    data = load_data()
    return jsonify({'address': address, 'staked': data.get('stakes', {}).get(address, 0)})


@app.route('/api/payouts', methods=['GET'])
def list_payouts():
    data = load_data()
    user = request.args.get('user')
    payouts = data.get('payouts', [])
    if user:
        payouts = [p for p in payouts if p.get('user_address') == user]
    return jsonify({'payouts': payouts})


def ensure_user(data, address):
    if address not in data.get('users', {}):
        data['users'][address] = {
            'address': address,
            'name': 'anonymous',
            'balance': 0,
            'reputation': 50,
            'total_bets': 0,
            'wins': 0,
            'losses': 0,
            'referralCode': None,
            'referrals': 0,
            'referralEarnings': 0,
            'is_admin': address == ADMIN_WALLET
        }


@app.route('/api/payouts/request', methods=['POST'])
def request_payout():
    data = load_data()
    body = request.json or {}
    user_address = body.get('user_address')
    to_address = body.get('to_address') or user_address
    amount = float(body.get('amount', 0))
    note = body.get('note', '')

    if not user_address or amount <= 0:
        return jsonify({'error': 'Invalid payout request'}), 400

    ensure_user(data, user_address)
    user = data['users'][user_address]
    balance = float(user.get('balance', 0))
    if amount > balance:
        return jsonify({'error': 'Insufficient balance'}), 400

    # deduct balance immediately and create payout request
    user['balance'] = round(balance - amount, 8)
    payout = {
        'id': secrets.token_hex(8),
        'user_address': user_address,
        'to_address': to_address,
        'amount': round(amount, 8),
        'note': note,
        'status': 'pending',
        'created_at': int(time.time() * 1000),
        'approved_by': None,
        'approved_at': None,
        'sent_at': None,
        'tx_hash': None,
        'error': None
    }
    data['payouts'].append(payout)
    data['transactions'].append({'type': 'payout_request', 'payout_id': payout['id'], 'user': user_address, 'amount': payout['amount'], 'timestamp': int(time.time() * 1000)})
    save_data(data)

    # Attempt automatic payout via configured signer service
    signer_url = os.environ.get('PAYOUT_SIGNER_URL')
    auto_send = os.environ.get('AUTO_SEND_PAYOUTS', 'false').lower() == 'true'
    if signer_url:
        try:
            import urllib.request
            payload = json.dumps({'to': payout['to_address'], 'amount': payout['amount'], 'payout_id': payout['id']}).encode('utf-8')
            req = urllib.request.Request(signer_url, data=payload, headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=30) as resp:
                res = json.loads(resp.read())
            # signer returns { tx_hash } on success or { status: 'pending' } or { error }
            if res.get('tx_hash'):
                payout['status'] = 'sent'
                payout['tx_hash'] = res.get('tx_hash')
                payout['sent_at'] = int(time.time() * 1000)
                payout['approved_by'] = 'auto'
                payout['approved_at'] = int(time.time() * 1000)
                data['transactions'].append({'type': 'payout_sent', 'payout_id': payout['id'], 'tx_hash': payout['tx_hash'], 'timestamp': int(time.time() * 1000)})
            else:
                # keep pending if signer returns pending, otherwise record error
                if res.get('status') == 'pending':
                    payout['status'] = 'pending'
                else:
                    payout['status'] = 'error'
                    payout['error'] = res.get('error', 'no tx_hash returned by signer')
        except Exception as e:
            payout['status'] = 'error'
            payout['error'] = str(e)
        save_data(data)
    elif auto_send:
        # auto_send requested but no signer configured — leave as pending but log
        payout['status'] = 'pending'
        save_data(data)

    return jsonify({'ok': True, 'payout': payout})


@app.route('/api/payouts/<payout_id>/approve', methods=['POST'])
def approve_payout(payout_id):
    data = load_data()
    body = request.json or {}
    admin_address = body.get('admin_address', '')
    if admin_address != ADMIN_WALLET:
        return jsonify({'error': 'Unauthorized. Admin only.'}), 403

    payout = next((p for p in data.get('payouts', []) if p['id'] == payout_id), None)
    if not payout:
        return jsonify({'error': 'Payout not found'}), 404
    if payout['status'] != 'pending':
        return jsonify({'error': 'Payout not in pending state'}), 400

    payout['status'] = 'approved'
    payout['approved_by'] = admin_address
    payout['approved_at'] = int(time.time() * 1000)
    save_data(data)

    # If a signer service is configured, call it to broadcast the transaction
    signer_url = os.environ.get('PAYOUT_SIGNER_URL')
    if signer_url:
        try:
            import urllib.request
            payload = json.dumps({'to': payout['to_address'], 'amount': payout['amount'], 'payout_id': payout['id']}).encode('utf-8')
            req = urllib.request.Request(signer_url, data=payload, headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=30) as resp:
                res = json.loads(resp.read())
            # signer should return { tx_hash: '0x...' }
            if res.get('tx_hash'):
                payout['status'] = 'sent'
                payout['tx_hash'] = res.get('tx_hash')
                payout['sent_at'] = int(time.time() * 1000)
                data['transactions'].append({'type': 'payout_sent', 'payout_id': payout['id'], 'tx_hash': payout['tx_hash'], 'timestamp': int(time.time() * 1000)})
            else:
                payout['status'] = 'error'
                payout['error'] = res.get('error', 'no tx_hash returned by signer')
        except Exception as e:
            payout['status'] = 'error'
            payout['error'] = str(e)
        save_data(data)

    return jsonify({'ok': True, 'payout': payout})


@app.route('/api/payouts/callback', methods=['POST'])
def payout_callback():
    """Callback endpoint for external signer to report status of payout.
    Expected body: { payout_id, status, tx_hash?, error? }
    """
    data = load_data()
    body = request.json or {}
    payout_id = body.get('payout_id')
    status = body.get('status')
    tx_hash = body.get('tx_hash')
    error = body.get('error')

    payout = next((p for p in data.get('payouts', []) if p['id'] == payout_id), None)
    if not payout:
        return jsonify({'error': 'Payout not found'}), 404

    if status == 'sent':
        payout['status'] = 'sent'
        payout['tx_hash'] = tx_hash or payout.get('tx_hash')
        payout['sent_at'] = int(time.time() * 1000)
        data['transactions'].append({'type': 'payout_sent', 'payout_id': payout['id'], 'tx_hash': payout['tx_hash'], 'timestamp': int(time.time() * 1000)})
    elif status == 'completed':
        payout['status'] = 'completed'
        payout['tx_hash'] = tx_hash or payout.get('tx_hash')
        payout['completed_at'] = int(time.time() * 1000)
        data['transactions'].append({'type': 'payout_completed', 'payout_id': payout['id'], 'tx_hash': payout['tx_hash'], 'timestamp': int(time.time() * 1000)})
    elif status == 'error':
        payout['status'] = 'error'
        payout['error'] = error or 'unknown error'
    else:
        payout['status'] = status or payout.get('status')

    save_data(data)
    return jsonify({'ok': True, 'payout': payout})


@app.route('/api/payouts/<payout_id>/complete', methods=['POST'])
def complete_payout(payout_id):
    data = load_data()
    body = request.json or {}
    admin_address = body.get('admin_address', '')
    tx_hash = body.get('tx_hash')
    if admin_address != ADMIN_WALLET:
        return jsonify({'error': 'Unauthorized. Admin only.'}), 403

    payout = next((p for p in data.get('payouts', []) if p['id'] == payout_id), None)
    if not payout:
        return jsonify({'error': 'Payout not found'}), 404
    payout['status'] = 'completed'
    payout['tx_hash'] = tx_hash or payout.get('tx_hash')
    payout['completed_at'] = int(time.time() * 1000)
    data['transactions'].append({'type': 'payout_completed', 'payout_id': payout['id'], 'tx_hash': payout['tx_hash'], 'timestamp': int(time.time() * 1000)})
    save_data(data)
    return jsonify({'ok': True, 'payout': payout})


@app.route('/api/payouts/<payout_id>/cancel', methods=['POST'])
def cancel_payout(payout_id):
    data = load_data()
    body = request.json or {}
    admin_address = body.get('admin_address', '')
    if admin_address != ADMIN_WALLET:
        return jsonify({'error': 'Unauthorized. Admin only.'}), 403

    payout = next((p for p in data.get('payouts', []) if p['id'] == payout_id), None)
    if not payout:
        return jsonify({'error': 'Payout not found'}), 404
    if payout['status'] in ('completed', 'sent'):
        return jsonify({'error': 'Cannot cancel already sent/completed payout'}), 400

    # refund the user's internal balance
    ensure_user(data, payout['user_address'])
    data['users'][payout['user_address']]['balance'] = round(data['users'][payout['user_address']].get('balance', 0) + payout['amount'], 8)
    payout['status'] = 'cancelled'
    payout['cancelled_at'] = int(time.time() * 1000)
    data['transactions'].append({'type': 'payout_cancelled', 'payout_id': payout['id'], 'timestamp': int(time.time() * 1000)})
    save_data(data)
    return jsonify({'ok': True, 'payout': payout})


@app.route('/.well-known/ton-connect.json', methods=['GET'])
def tonconnect_manifest():
    # Minimal TonConnect manifest — adjust icons/homepage as needed
    manifest = {
        'name': 'betton',
        'description': 'betton — ставки на криптовалюты',
        'homepage': 'https://bet-ton.onrender.com',
        'icons': [f'https://bet-ton.onrender.com/logo192.png'],
        'redirect': {'login': 'https://bet-ton.onrender.com'}
    }
    return jsonify(manifest)


@app.route('/api/deposits', methods=['GET'])
def list_deposits():
    data = load_data()
    user = request.args.get('user')
    deposits = data.get('deposits', [])
    if user:
        deposits = [d for d in deposits if d.get('user_address') == user]
    return jsonify({'deposits': deposits})


@app.route('/api/deposits/request', methods=['POST'])
def request_deposit():
    data = load_data()
    body = request.json or {}
    user_address = body.get('user_address')
    tx_hash = body.get('tx_hash')
    amount = float(body.get('amount', 0))
    to_address = body.get('to_address')
    currency = (body.get('currency') or 'TON').upper()

    if not user_address or amount <= 0:
        return jsonify({'error': 'Invalid deposit request'}), 400

    deposit = {
        'id': secrets.token_hex(8),
        'user_address': user_address,
        'to_address': to_address or TREASURY_WALLET,
        'tx_hash': tx_hash,
        'amount': round(amount, 8),
        'currency': currency,
        'converted_amount_usdt': None,
        'original_amount_ton': amount if currency == 'TON' else None,
        'status': 'pending',
        'created_at': int(time.time() * 1000),
        'approved_by': None,
        'approved_at': None,
        'rejected_at': None,
        'note': body.get('note', '')
    }
    data['deposits'].append(deposit)
    data['transactions'].append({'type': 'deposit_request', 'deposit_id': deposit['id'], 'user': user_address, 'amount': deposit['amount'], 'timestamp': int(time.time() * 1000)})
    save_data(data)
    # Try automatic verification if a verifier is configured or AUTO_APPROVE_DEPOSITS is enabled
    verifier = os.environ.get('DEPOSIT_VERIFIER_URL')
    auto_approve = os.environ.get('AUTO_APPROVE_DEPOSITS', 'false').lower() == 'true'
    if verifier and tx_hash:
        try:
            import urllib.request
            payload = json.dumps({'tx_hash': tx_hash}).encode('utf-8')
            req = urllib.request.Request(verifier, data=payload, headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=30) as resp:
                res = json.loads(resp.read())
            # expected { valid: bool, to: address, amount: number }
            if res.get('valid'):
                # ensure funds went to treasury and amounts match
                to_addr = res.get('to')
                verified_amount = float(res.get('amount', 0))
                if to_addr and to_addr == (deposit['to_address'] or TREASURY_WALLET) and verified_amount >= deposit['amount']:
                    # conversion: if deposit in TON, convert to USDT by current TON/USD price
                    if deposit.get('currency') == 'TON':
                        price = fetch_usd_price('the-open-network') or 0
                        converted = round(verified_amount * price, 8)
                        deposit['converted_amount_usdt'] = converted
                        deposit['original_amount_ton'] = verified_amount
                        credit_amount = converted
                    else:
                        credit_amount = round(verified_amount, 8)

                    ensure_user(data, deposit['user_address'])
                    data['users'][deposit['user_address']]['balance'] = round(data['users'][deposit['user_address']].get('balance', 0) + credit_amount, 8)
                    deposit['status'] = 'approved'
                    deposit['approved_by'] = 'auto'
                    deposit['approved_at'] = int(time.time() * 1000)
                    data['transactions'].append({'type': 'deposit_approved', 'deposit_id': deposit['id'], 'user': deposit['user_address'], 'amount': credit_amount, 'timestamp': int(time.time() * 1000)})
                else:
                    deposit['status'] = 'rejected'
                    deposit['rejection_reason'] = 'verification failed (to/amount mismatch)'
        except Exception as e:
            deposit['status'] = 'pending'
            deposit['note'] = f'verifier error: {e}'
        save_data(data)
    elif auto_approve:
        # auto-approve: treat currency accordingly
        if deposit.get('currency') == 'TON':
            price = fetch_usd_price('the-open-network') or 0
            converted = round(deposit['amount'] * price, 8)
            deposit['converted_amount_usdt'] = converted
            deposit['original_amount_ton'] = deposit['amount']
            credit_amount = converted
        else:
            credit_amount = round(deposit['amount'], 8)
        ensure_user(data, deposit['user_address'])
        data['users'][deposit['user_address']]['balance'] = round(data['users'][deposit['user_address']].get('balance', 0) + credit_amount, 8)
        deposit['status'] = 'approved'
        deposit['approved_by'] = 'auto'
        deposit['approved_at'] = int(time.time() * 1000)
        data['transactions'].append({'type': 'deposit_approved', 'deposit_id': deposit['id'], 'user': deposit['user_address'], 'amount': credit_amount, 'timestamp': int(time.time() * 1000)})
        save_data(data)

    return jsonify({'ok': True, 'deposit': deposit})


@app.route('/api/deposits/<deposit_id>/approve', methods=['POST'])
def approve_deposit(deposit_id):
    data = load_data()
    body = request.json or {}
    admin_address = body.get('admin_address', '')
    if admin_address != ADMIN_WALLET:
        return jsonify({'error': 'Unauthorized. Admin only.'}), 403

    deposit = next((d for d in data.get('deposits', []) if d['id'] == deposit_id), None)
    if not deposit:
        return jsonify({'error': 'Deposit not found'}), 404
    if deposit['status'] != 'pending':
        return jsonify({'error': 'Deposit not pending'}), 400

    # Credit user balance
    ensure_user(data, deposit['user_address'])
    data['users'][deposit['user_address']]['balance'] = round(data['users'][deposit['user_address']].get('balance', 0) + deposit['amount'], 8)
    deposit['status'] = 'approved'
    deposit['approved_by'] = admin_address
    deposit['approved_at'] = int(time.time() * 1000)
    data['transactions'].append({'type': 'deposit_approved', 'deposit_id': deposit['id'], 'user': deposit['user_address'], 'amount': deposit['amount'], 'timestamp': int(time.time() * 1000)})
    save_data(data)
    return jsonify({'ok': True, 'deposit': deposit})


@app.route('/api/deposits/<deposit_id>/reject', methods=['POST'])
def reject_deposit(deposit_id):
    data = load_data()
    body = request.json or {}
    admin_address = body.get('admin_address', '')
    reason = body.get('reason', '')
    if admin_address != ADMIN_WALLET:
        return jsonify({'error': 'Unauthorized. Admin only.'}), 403

    deposit = next((d for d in data.get('deposits', []) if d['id'] == deposit_id), None)
    if not deposit:
        return jsonify({'error': 'Deposit not found'}), 404
    if deposit['status'] != 'pending':
        return jsonify({'error': 'Deposit not pending'}), 400

    deposit['status'] = 'rejected'
    deposit['rejected_at'] = int(time.time() * 1000)
    deposit['rejection_reason'] = reason
    data['transactions'].append({'type': 'deposit_rejected', 'deposit_id': deposit['id'], 'timestamp': int(time.time() * 1000)})
    save_data(data)
    return jsonify({'ok': True, 'deposit': deposit})


@app.route('/api/deposits/callback', methods=['POST'])
def deposit_callback():
    """Callback endpoint for external verifier to mark deposits approved/rejected.
    Expected body: { deposit_id, valid: bool, to?, amount?, error? }
    """
    data = load_data()
    body = request.json or {}
    deposit_id = body.get('deposit_id')
    valid = body.get('valid')
    to = body.get('to')
    amount = body.get('amount')
    error = body.get('error')

    deposit = next((d for d in data.get('deposits', []) if d['id'] == deposit_id), None)
    if not deposit:
        return jsonify({'error': 'Deposit not found'}), 404

    if valid:
        # If deposit was in TON, convert to USDT equivalent
        if deposit.get('currency') == 'TON':
            price = fetch_usd_price('the-open-network') or 0
            converted = round(deposit.get('original_amount_ton', deposit['amount']) * price, 8)
            deposit['converted_amount_usdt'] = converted
            credit_amount = converted
        else:
            credit_amount = round(deposit['amount'], 8)
        ensure_user(data, deposit['user_address'])
        data['users'][deposit['user_address']]['balance'] = round(data['users'][deposit['user_address']].get('balance', 0) + credit_amount, 8)
        deposit['status'] = 'approved'
        deposit['approved_by'] = 'verifier'
        deposit['approved_at'] = int(time.time() * 1000)
        data['transactions'].append({'type': 'deposit_approved', 'deposit_id': deposit['id'], 'user': deposit['user_address'], 'amount': credit_amount, 'timestamp': int(time.time() * 1000)})
    else:
        deposit['status'] = 'rejected'
        deposit['rejection_reason'] = error or 'verification failed'

    save_data(data)
    return jsonify({'ok': True, 'deposit': deposit})

# ============ API: TREASURY ============

@app.route('/api/treasury', methods=['GET'])
def get_treasury():
    data = load_data()
    return jsonify(data['treasury'])


@app.route('/api/treasury_wallet', methods=['GET'])
def get_treasury_wallet():
    # Return the configured treasury wallet address (for operator use)
    return jsonify({'treasury_wallet': TREASURY_WALLET})

# ============ API: USER ============

@app.route('/api/user/<address>', methods=['GET'])
def get_user(address):
    data = load_data()
    user = data['users'].get(address, {
        'address': address,
        'name': 'anonymous',
        'balance': 0,
        'reputation': 50,
        'total_bets': 0,
        'wins': 0,
        'losses': 0,
        'referralCode': None,
        'referrals': 0,
        'referralEarnings': 0,
        'is_admin': address == ADMIN_WALLET
    })
    return jsonify(user)

# ============ API: COINGECKO ORACLE ============

@app.route('/api/oracle/price/<coin_id>', methods=['GET'])
def get_price(coin_id):
    """Proxy to CoinGecko API to avoid CORS issues"""
    import urllib.request
    try:
        url = f'https://api.coingecko.com/api/v3/simple/price?ids={coin_id}&vs_currencies=usd'
        req = urllib.request.Request(url, headers={'User-Agent': 'betton/1.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            return jsonify(json.loads(resp.read()))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============ HEALTH CHECK ============

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'time': int(time.time() * 1000)})

# ============ RUN ============

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
