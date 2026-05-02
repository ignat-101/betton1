from flask import Flask, jsonify, request, send_from_directory
import os
import json
import time
import hashlib
import secrets

app = Flask(__name__, static_folder='dist', static_url_path='')

# ============ CONFIG ============
ADMIN_WALLET = 'UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0'
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
        'treasury': {'balance': 0, 'total_volume': 0}
    }

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
        'resolved_at': None
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

    # Update pool
    market['outcomes'][outcome]['pool'] += amount
    market['total_volume'] = market['outcomes']['yes']['pool'] + market['outcomes']['no']['pool']

    # Recalculate probabilities
    yes_pool = market['outcomes']['yes']['pool']
    total = market['outcomes']['yes']['pool'] + market['outcomes']['no']['pool']
    market['outcomes']['yes']['probability'] = round((yes_pool / total) * 100) if total > 0 else 50
    market['outcomes']['no']['probability'] = 100 - market['outcomes']['yes']['probability']

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

# ============ API: TREASURY ============

@app.route('/api/treasury', methods=['GET'])
def get_treasury():
    data = load_data()
    return jsonify(data['treasury'])

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
        req = urllib.request.Request(url, headers={'User-Agent': 'TON-FlashBet/1.0'})
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
