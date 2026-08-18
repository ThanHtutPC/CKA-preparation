from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)

# In-memory storage (for demo purposes)
# In production, use a real database
users = []
products = []
orders = []

# ============ HELPER FUNCTIONS ============
def find_item_by_id(items, item_id):
    """Find an item by ID in a list"""
    for item in items:
        if item['id'] == item_id:
            return item
    return None

def validate_required_fields(data, required_fields):
    """Validate required fields in request data"""
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    return True, ""

def generate_id():
    """Generate a unique ID"""
    return str(uuid.uuid4())[:8]

def get_timestamp():
    """Get current timestamp"""
    return datetime.now().isoformat()

# ============ SUBPATH 1: /api/users ============
@app.route('/api/users', methods=['GET', 'POST'])
@app.route('/api/users/<user_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_users(user_id=None):
    """CRUD operations for users"""
    
    # GET all users
    if request.method == 'GET' and user_id is None:
        return jsonify({
            'status': 'success',
            'data': users,
            'count': len(users)
        }), 200
    
    # GET specific user
    if request.method == 'GET' and user_id:
        user = find_item_by_id(users, user_id)
        if user:
            return jsonify({
                'status': 'success',
                'data': user
            }), 200
        return jsonify({
            'status': 'error',
            'message': 'User not found'
        }), 404
    
    # POST - Create new user
    if request.method == 'POST':
        data = request.get_json()
        
        # Validate required fields
        valid, message = validate_required_fields(data, ['name', 'email'])
        if not valid:
            return jsonify({
                'status': 'error',
                'message': message
            }), 400
        
        # Check if email already exists
        for user in users:
            if user['email'] == data['email']:
                return jsonify({
                    'status': 'error',
                    'message': 'Email already exists'
                }), 409
        
        new_user = {
            'id': generate_id(),
            'name': data['name'],
            'email': data['email'],
            'created_at': get_timestamp(),
            'updated_at': get_timestamp()
        }
        users.append(new_user)
        return jsonify({
            'status': 'success',
            'message': 'User created successfully',
            'data': new_user
        }), 201
    
    # PUT - Update user
    if request.method == 'PUT':
        user = find_item_by_id(users, user_id)
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'User not found'
            }), 404
        
        data = request.get_json()
        if 'name' in data:
            user['name'] = data['name']
        if 'email' in data:
            # Check if new email conflicts
            for u in users:
                if u['email'] == data['email'] and u['id'] != user_id:
                    return jsonify({
                        'status': 'error',
                        'message': 'Email already exists'
                    }), 409
            user['email'] = data['email']
        user['updated_at'] = get_timestamp()
        
        return jsonify({
            'status': 'success',
            'message': 'User updated successfully',
            'data': user
        }), 200
    
    # DELETE - Delete user
    if request.method == 'DELETE':
        user = find_item_by_id(users, user_id)
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'User not found'
            }), 404
        
        users.remove(user)
        return jsonify({
            'status': 'success',
            'message': 'User deleted successfully'
        }), 200

# ============ SUBPATH 2: /api/products ============
@app.route('/api/products', methods=['GET', 'POST'])
@app.route('/api/products/<product_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_products(product_id=None):
    """CRUD operations for products"""
    
    # GET all products
    if request.method == 'GET' and product_id is None:
        return jsonify({
            'status': 'success',
            'data': products,
            'count': len(products)
        }), 200
    
    # GET specific product
    if request.method == 'GET' and product_id:
        product = find_item_by_id(products, product_id)
        if product:
            return jsonify({
                'status': 'success',
                'data': product
            }), 200
        return jsonify({
            'status': 'error',
            'message': 'Product not found'
        }), 404
    
    # POST - Create new product
    if request.method == 'POST':
        data = request.get_json()
        
        valid, message = validate_required_fields(data, ['name', 'price'])
        if not valid:
            return jsonify({
                'status': 'error',
                'message': message
            }), 400
        
        try:
            price = float(data['price'])
            if price < 0:
                raise ValueError("Price must be positive")
        except (ValueError, TypeError):
            return jsonify({
                'status': 'error',
                'message': 'Price must be a positive number'
            }), 400
        
        new_product = {
            'id': generate_id(),
            'name': data['name'],
            'price': price,
            'description': data.get('description', ''),
            'stock': int(data.get('stock', 0)),
            'created_at': get_timestamp(),
            'updated_at': get_timestamp()
        }
        products.append(new_product)
        return jsonify({
            'status': 'success',
            'message': 'Product created successfully',
            'data': new_product
        }), 201
    
    # PUT - Update product
    if request.method == 'PUT':
        product = find_item_by_id(products, product_id)
        if not product:
            return jsonify({
                'status': 'error',
                'message': 'Product not found'
            }), 404
        
        data = request.get_json()
        if 'name' in data:
            product['name'] = data['name']
        if 'price' in data:
            try:
                price = float(data['price'])
                if price < 0:
                    raise ValueError("Price must be positive")
                product['price'] = price
            except (ValueError, TypeError):
                return jsonify({
                    'status': 'error',
                    'message': 'Price must be a positive number'
                }), 400
        if 'description' in data:
            product['description'] = data['description']
        if 'stock' in data:
            product['stock'] = int(data['stock'])
        product['updated_at'] = get_timestamp()
        
        return jsonify({
            'status': 'success',
            'message': 'Product updated successfully',
            'data': product
        }), 200
    
    # DELETE - Delete product
    if request.method == 'DELETE':
        product = find_item_by_id(products, product_id)
        if not product:
            return jsonify({
                'status': 'error',
                'message': 'Product not found'
            }), 404
        
        products.remove(product)
        return jsonify({
            'status': 'success',
            'message': 'Product deleted successfully'
        }), 200

# ============ SUBPATH 3: /api/orders ============
@app.route('/api/orders', methods=['GET', 'POST'])
@app.route('/api/orders/<order_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_orders(order_id=None):
    """CRUD operations for orders"""
    
    # GET all orders
    if request.method == 'GET' and order_id is None:
        return jsonify({
            'status': 'success',
            'data': orders,
            'count': len(orders)
        }), 200
    
    # GET specific order
    if request.method == 'GET' and order_id:
        order = find_item_by_id(orders, order_id)
        if order:
            return jsonify({
                'status': 'success',
                'data': order
            }), 200
        return jsonify({
            'status': 'error',
            'message': 'Order not found'
        }), 404
    
    # POST - Create new order
    if request.method == 'POST':
        data = request.get_json()
        
        valid, message = validate_required_fields(data, ['user_id', 'product_id', 'quantity'])
        if not valid:
            return jsonify({
                'status': 'error',
                'message': message
            }), 400
        
        # Validate user exists
        user = find_item_by_id(users, data['user_id'])
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'User not found'
            }), 404
        
        # Validate product exists
        product = find_item_by_id(products, data['product_id'])
        if not product:
            return jsonify({
                'status': 'error',
                'message': 'Product not found'
            }), 404
        
        try:
            quantity = int(data['quantity'])
            if quantity <= 0:
                raise ValueError("Quantity must be positive")
        except (ValueError, TypeError):
            return jsonify({
                'status': 'error',
                'message': 'Quantity must be a positive integer'
            }), 400
        
        new_order = {
            'id': generate_id(),
            'user_id': data['user_id'],
            'product_id': data['product_id'],
            'quantity': quantity,
            'total_price': product['price'] * quantity,
            'status': data.get('status', 'pending'),
            'created_at': get_timestamp(),
            'updated_at': get_timestamp()
        }
        orders.append(new_order)
        return jsonify({
            'status': 'success',
            'message': 'Order created successfully',
            'data': new_order
        }), 201
    
    # PUT - Update order
    if request.method == 'PUT':
        order = find_item_by_id(orders, order_id)
        if not order:
            return jsonify({
                'status': 'error',
                'message': 'Order not found'
            }), 404
        
        data = request.get_json()
        
        if 'quantity' in data:
            try:
                quantity = int(data['quantity'])
                if quantity <= 0:
                    raise ValueError("Quantity must be positive")
                order['quantity'] = quantity
                # Update total price
                product = find_item_by_id(products, order['product_id'])
                if product:
                    order['total_price'] = product['price'] * quantity
            except (ValueError, TypeError):
                return jsonify({
                    'status': 'error',
                    'message': 'Quantity must be a positive integer'
                }), 400
        
        if 'status' in data:
            valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
            if data['status'] not in valid_statuses:
                return jsonify({
                    'status': 'error',
                    'message': f'Status must be one of: {", ".join(valid_statuses)}'
                }), 400
            order['status'] = data['status']
        
        order['updated_at'] = get_timestamp()
        
        return jsonify({
            'status': 'success',
            'message': 'Order updated successfully',
            'data': order
        }), 200
    
    # DELETE - Delete order
    if request.method == 'DELETE':
        order = find_item_by_id(orders, order_id)
        if not order:
            return jsonify({
                'status': 'error',
                'message': 'Order not found'
            }), 404
        
        orders.remove(order)
        return jsonify({
            'status': 'success',
            'message': 'Order deleted successfully'
        }), 200

# ============ HEALTH CHECK ============
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': get_timestamp(),
        'service': 'Flask CRUD API',
        'version': '1.0.0'
    }), 200

# ============ ROOT ENDPOINT ============
@app.route('/', methods=['GET'])
def root():
    """Root endpoint with API information"""
    return jsonify({
        'message': 'Welcome to Flask CRUD API',
        'version': '1.0.0',
        'endpoints': {
            'users': '/api/users',
            'products': '/api/products',
            'orders': '/api/orders',
            'health': '/health'
        },
        'documentation': 'Each endpoint supports GET, POST, PUT, DELETE operations'
    }), 200

# ============ ERROR HANDLERS ============
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'status': 'error',
        'message': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'status': 'error',
        'message': 'Internal server error'
    }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
