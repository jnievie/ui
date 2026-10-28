"""
DALOY — Farm Resources in Motion
Python Flask + MySQL Backend Server (app.py)

HOW TO RUN IN VS CODE (Do NOT use VS Code "Go Live" / port 5500 alone):
1. Start MySQL in XAMPP Control Panel (or MySQL Workbench / MySQL Server).
2. Open the VS Code Terminal (Ctrl + ` ) and install dependencies once:
       pip install flask mysql-connector-python
3. Run the Python Flask server:
       python app.py
4. Open this exact address in your browser:
       http://127.0.0.1:5000
"""

import os
import sys
import secrets
from datetime import date
from decimal import Decimal
from functools import wraps

try:
    from flask import Flask, request, jsonify, session, send_file, send_from_directory
    from werkzeug.security import check_password_hash
except ImportError:
    print("\n[DALOY SETUP ERROR] Flask is not installed yet.")
    print("Run this command in your VS Code Terminal first:")
    print("    pip install flask mysql-connector-python\n")
    sys.exit(1)

try:
    import mysql.connector
    from mysql.connector import Error
except ImportError:
    print("\n[DALOY SETUP ERROR] mysql-connector-python is not installed yet.")
    print("Run this command in your VS Code Terminal first:")
    print("    pip install flask mysql-connector-python\n")
    sys.exit(1)

app = Flask(__name__, static_folder=None)
app.secret_key = os.environ.get("DALOY_SECRET_KEY", "daloy-farm-resources-secret-2026")
ACTIVE_TOKENS = {}

# ============================================================================
# MYSQL DATABASE CONFIGURATION (Update password if your MySQL root has one)
# ============================================================================
DB_CONFIG = {
    "host": os.environ.get("MYSQL_HOST", "localhost"),
    "port": int(os.environ.get("MYSQL_PORT", 3306)),
    "user": os.environ.get("MYSQL_USER", "root"),
    "password": os.environ.get("MYSQL_PASSWORD", ""),
    "database": os.environ.get("MYSQL_DATABASE", "daloy_db"),
}


# ============================================================================
# CORS SUPPORT (Allows VS Code Live Server :5500 to talk to Flask :5000)
# ============================================================================
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        return add_cors_headers(response)


@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    else:
        response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Daloy-Session"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response


# ============================================================================
# AUTOMATIC DATABASE INITIALIZER & MYSQL CONNECTION HELPERS
# ============================================================================
def split_sql_statements(sql_script):
    """Split a .sql file into individual SQL statements while respecting quotes."""
    cleaned_lines = []
    for line in sql_script.splitlines():
        if line.strip().startswith("--"):
            continue
        cleaned_lines.append(line)
    text = "\n".join(cleaned_lines)

    statements = []
    current = []
    in_single_quote = False
    i = 0
    length = len(text)

    while i < length:
        ch = text[i]
        if ch == "'":
            if in_single_quote and i + 1 < length and text[i + 1] == "'":
                current.append("''")
                i += 2
                continue
            if i == 0 or text[i - 1] != "\\":
                in_single_quote = not in_single_quote
        if ch == ";" and not in_single_quote:
            stmt = "".join(current).strip()
            if stmt:
                statements.append(stmt)
            current = []
        else:
            current.append(ch)
        i += 1

    tail = "".join(current).strip()
    if tail:
        statements.append(tail)
    return statements


SEARCH_DIRS = [
    os.path.dirname(os.path.abspath(__file__)),
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
]


def resolve_project_path(*parts):
    """Find a project file in either the same folder as app.py or the parent folder."""
    for base in SEARCH_DIRS:
        candidate = os.path.join(base, *parts)
        if os.path.exists(candidate):
            return candidate
    return os.path.join(SEARCH_DIRS[0], *parts)


def initialize_database_from_sql_file():
    """Automatically create and seed daloy_db from database.sql if missing."""
    sql_path = resolve_project_path("database.sql")
    if not os.path.exists(sql_path):
        sql_path = resolve_project_path("sql", "database.sql")
    if not os.path.exists(sql_path):
        return False

    server_config = {k: v for k, v in DB_CONFIG.items() if k != "database"}
    conn = mysql.connector.connect(**server_config)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = %s AND table_name = 'users'
        """,
        (DB_CONFIG["database"],),
    )
    exists = cursor.fetchone()[0] > 0

    if not exists:
        print(f"[DALOY] Creating '{DB_CONFIG['database']}' and importing sample data from database.sql...")
        with open(sql_path, "r", encoding="utf-8") as f:
            statements = split_sql_statements(f.read())
        for stmt in statements:
            cursor.execute(stmt)
        conn.commit()
        print(f"[DALOY] Database '{DB_CONFIG['database']}' initialized successfully!")

    cursor.close()
    conn.close()
    return True


def format_mysql_error(err):
    """Return a clear, beginner-friendly message for common local MySQL errors."""
    errno = getattr(err, "errno", None)
    if errno == 2003:
        return (
            f"Cannot connect to MySQL on {DB_CONFIG['host']}:{DB_CONFIG['port']}. "
            "Please open XAMPP Control Panel and click 'Start' next to MySQL, then try again."
        )
    if errno == 1045:
        return (
            f"MySQL Access Denied for user '{DB_CONFIG['user']}'. "
            "Open app.py and set your MySQL password inside DB_CONFIG['password']."
        )
    if errno == 1049:
        return (
            f"MySQL database '{DB_CONFIG['database']}' does not exist yet. "
            "Import database.sql in phpMyAdmin / MySQL Workbench or keep database.sql next to app.py."
        )
    return f"MySQL Database Error: {getattr(err, 'msg', str(err))}"


def get_db_connection():
    """Create and return a new connection to the MySQL database (auto-seeding if needed)."""
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except Error as err:
        if getattr(err, "errno", None) == 1049:
            initialize_database_from_sql_file()
            return mysql.connector.connect(**DB_CONFIG)
        raise


def serialize_row(row):
    """Convert MySQL Decimal and date/datetime objects into JSON-safe values."""
    if row is None:
        return None
    clean = {}
    for key, value in row.items():
        if isinstance(value, Decimal):
            clean[key] = float(value)
        elif hasattr(value, "isoformat"):
            clean[key] = value.isoformat()
        else:
            clean[key] = value
    return clean


def compute_stock_status(quantity, reorder_level):
    """Automatically classify supply stock status based on quantity and reorder level."""
    qty = float(quantity)
    reorder = float(reorder_level)
    if qty <= 0:
        return "Out of Stock"
    if qty <= reorder:
        return "Low Stock"
    return "In Stock"


def log_activity(cursor, activity_type, description, actor):
    """Insert an audit entry into the activities table for the Dashboard feed."""
    cursor.execute(
        "INSERT INTO activities (activity_type, description, actor) VALUES (%s, %s, %s)",
        (activity_type, description, actor),
    )


def get_current_user():
    """Retrieve the logged-in user from Flask session or X-Daloy-Session header."""
    token = request.headers.get("X-Daloy-Session", "")
    if token and token in ACTIVE_TOKENS:
        return ACTIVE_TOKENS[token]
    if "user" in session:
        return session["user"]
    return None


def get_actor_name():
    user = get_current_user()
    return user["full_name"] if user else "Cooperative Coordinator"


def login_required(route_func):
    """Ensure a user is logged in before accessing protected API endpoints."""
    @wraps(route_func)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required. Please log in first."}), 401
        session["user"] = user
        return route_func(*args, **kwargs)
    return wrapper


# ============================================================================
# FRONTEND & IMAGE STATIC ROUTES
# ============================================================================
@app.route("/")
def serve_index():
    """Serve the single-file HTML/CSS frontend."""
    return send_file(resolve_project_path("index.html"))


@app.route("/favicon.svg")
def serve_favicon():
    favicon_path = resolve_project_path("public", "favicon.svg")
    if os.path.exists(favicon_path):
        return send_file(favicon_path, mimetype="image/svg+xml")
    return ("", 204)


@app.route("/images/<path:filename>")
def serve_images(filename):
    """Serve agriculture photographs from ./public/images, ../public/images, or ./images."""
    for base in SEARCH_DIRS:
        for folder_parts in (("public", "images"), ("images",)):
            folder = os.path.join(base, *folder_parts)
            if os.path.isdir(folder) and os.path.exists(os.path.join(folder, filename)):
                return send_from_directory(folder, filename)
    return ("Image not found", 404)


# ============================================================================
# 1. AUTHENTICATION ROUTES (Login, Session Check, Logout)
# ============================================================================
@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    identifier = (data.get("identifier") or "").strip()
    password = (data.get("password") or "").strip()

    if not identifier or not password:
        return jsonify({"error": "Please enter both your username/email and password."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM users WHERE username = %s OR email = %s LIMIT 1",
            (identifier, identifier),
        )
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            return jsonify({"error": "Invalid username/email or password."}), 401

        stored_pw = user["password"]
        is_hashed = stored_pw.startswith("scrypt:") or stored_pw.startswith("pbkdf2:")
        valid_password = check_password_hash(stored_pw, password) if is_hashed else (stored_pw == password)

        if not valid_password:
            cursor.close()
            conn.close()
            return jsonify({"error": "Invalid username/email or password."}), 401

        session_user = {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
        }
        token = secrets.token_hex(16)
        ACTIVE_TOKENS[token] = session_user
        session["user"] = session_user

        cursor.close()
        conn.close()
        return jsonify({"message": "Login successful.", "user": session_user, "token": token})
    except Error as err:
        return jsonify({"error": format_mysql_error(err)}), 500


@app.route("/api/me", methods=["GET"])
def api_me():
    user = get_current_user()
    if user:
        return jsonify({"authenticated": True, "user": user})
    return jsonify({"authenticated": False, "user": None})


@app.route("/api/logout", methods=["POST"])
def api_logout():
    token = request.headers.get("X-Daloy-Session", "")
    ACTIVE_TOKENS.pop(token, None)
    session.pop("user", None)
    return jsonify({"message": "Logged out successfully."})


# ============================================================================
# 2. DASHBOARD SUMMARY ROUTE
# ============================================================================
@app.route("/api/dashboard", methods=["GET"])
@login_required
def api_dashboard():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT COUNT(*) AS count FROM supplies")
        total_supplies = cursor.fetchone()["count"]

        cursor.execute(
            "SELECT COUNT(*) AS count FROM supplies WHERE quantity <= reorder_level"
        )
        low_stock_count = cursor.fetchone()["count"]

        cursor.execute(
            "SELECT COUNT(*) AS count FROM exchange_listings WHERE status = 'Available'"
        )
        active_listings = cursor.fetchone()["count"]

        cursor.execute(
            "SELECT COUNT(*) AS count FROM transactions WHERE status = 'Completed'"
        )
        completed_exchanges = cursor.fetchone()["count"]

        cursor.execute(
            "SELECT * FROM activities ORDER BY id DESC LIMIT 8"
        )
        activities = [serialize_row(r) for r in cursor.fetchall()]

        cursor.execute(
            "SELECT * FROM supplies WHERE quantity <= reorder_level ORDER BY quantity ASC LIMIT 5"
        )
        low_stock_items = [serialize_row(r) for r in cursor.fetchall()]

        cursor.close()
        conn.close()

        return jsonify({
            "summary": {
                "total_supplies": total_supplies,
                "low_stock": low_stock_count,
                "exchange_listings": active_listings,
                "completed_exchanges": completed_exchanges,
            },
            "activities": activities,
            "low_stock_items": low_stock_items,
        })
    except Error as err:
        return jsonify({"error": format_mysql_error(err)}), 500


# ============================================================================
# 3. INVENTORY MANAGEMENT CRUD ROUTES (/api/supplies)
# ============================================================================
@app.route("/api/supplies", methods=["GET"])
@login_required
def get_supplies():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM supplies ORDER BY id DESC")
        rows = [serialize_row(r) for r in cursor.fetchall()]
        cursor.close()
        conn.close()
        return jsonify(rows)
    except Error as err:
        return jsonify({"error": format_mysql_error(err)}), 500


@app.route("/api/supplies", methods=["POST"])
@login_required
def create_supply():
    data = request.get_json(silent=True) or {}
    item_name = (data.get("item_name") or "").strip()
    category = (data.get("category") or "").strip()
    unit = (data.get("unit") or "").strip()
    item_condition = (data.get("item_condition") or "New").strip()
    notes = (data.get("notes") or "").strip()

    if not item_name or not category or not unit:
        return jsonify({"error": "Item name, category, and unit are required."}), 400

    try:
        quantity = float(data.get("quantity", 0))
        reorder_level = float(data.get("reorder_level", 10))
        unit_price = float(data.get("unit_price", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Quantity, reorder level, and price must be valid numbers."}), 400

    if quantity < 0 or unit_price < 0 or reorder_level < 0:
        return jsonify({"error": "Numeric values cannot be negative."}), 400

    stock_status = compute_stock_status(quantity, reorder_level)

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            INSERT INTO supplies
              (item_name, category, quantity, reorder_level, unit, item_condition, unit_price, stock_status, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (item_name, category, quantity, reorder_level, unit, item_condition, unit_price, stock_status, notes),
        )
        new_id = cursor.lastrowid
        log_activity(
            cursor,
            "Supply",
            f"Added supply '{item_name}' ({quantity:g} {unit}, {stock_status}).",
            get_actor_name(),
        )
        conn.commit()

        cursor.execute("SELECT * FROM supplies WHERE id = %s", (new_id,))
        created = serialize_row(cursor.fetchone())
        cursor.close()
        conn.close()
        return jsonify(created), 201
    except Error as err:
        return jsonify({"error": format_mysql_error(err)}), 500


@app.route("/api/supplies/<int:supply_id>", methods=["PUT"])
@login_required
def update_supply(supply_id):
    data = request.get_json(silent=True) or {}
    item_name = (data.get("item_name") or "").strip()
    category = (data.get("category") or "").strip()
    unit = (data.get("unit") or "").strip()
    item_condition = (data.get("item_condition") or "New").strip()
    notes = (data.get("notes") or "").strip()

    if not item_name or not category or not unit:
        return jsonify({"error": "Item name, category, and unit are required."}), 400

    try:
        quantity = float(data.get("quantity", 0))
        reorder_level = float(data.get("reorder_level", 10))
        unit_price = float(data.get("unit_price", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Quantity, reorder level, and price must be valid numbers."}), 400

    if quantity < 0 or unit_price < 0 or reorder_level < 0:
        return jsonify({"error": "Numeric values cannot be negative."}), 400

    stock_status = compute_stock_status(quantity, reorder_level)

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            UPDATE supplies
            SET item_name=%s, category=%s, quantity=%s, reorder_level=%s,
                unit=%s, item_condition=%s, unit_price=%s, stock_status=%s, notes=%s
            WHERE id=%s
            """,
            (item_name, category, quantity, reorder_level, unit, item_condition, unit_price, stock_status, notes, supply_id),
        )
        log_activity(
            cursor,
            "Supply",
            f"Updated supply '{item_name}' — now {quantity:g} {unit} ({stock_status}).",
            get_actor_name(),
        )
        conn.commit()

        cursor.execute("SELECT * FROM supplies WHERE id = %s", (supply_id,))
        updated = serialize_row(cursor.fetchone())
        cursor.close()
        conn.close()
        return jsonify(updated)
    except Error as err:
        return jsonify({"error": format_mysql_error(err)}), 500


@app.route("/api/supplies/<int:supply_id>", methods=["DELETE"])
@login_required
def delete_supply(supply_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT item_name FROM supplies WHERE id = %s", (supply_id,))
        existing = cursor.fetchone()
        if not existing:
            cursor.close()
            conn.close()
            return jsonify({"error": "Supply item not found."}), 404

        cursor.execute("DELETE FROM supplies WHERE id = %s", (supply_id,))
        log_activity(
            cursor,
            "Supply",
            f"Removed supply '{existing['item_name']}' from inventory.",
            get_actor_name(),
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Supply deleted successfully."})
    except Error as err:
        return jsonify({"error": format_mysql_error(err)}), 500


# ============================================================================
# 4. FARMERS MANAGEMENT CRUD ROUTES (/api/farmers)
# ============================================================================
@app.route("/api/farmers", methods=["GET"])
@login_required
def get_farmers():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM farmers ORDER BY id DESC")
        rows = [serialize_row(r) for r in cursor.fetchall()]
        cursor.close()
        conn.close()
        return jsonify(rows)
    except Error as err:
        return jsonify({"error": format_mysql_error(err)}), 500


@app.route("/api/farmers", methods=["POST"])
@login_required
def create_farmer():
    data = request.get_json(silent=True) or {}
    full_name = (data.get("full_name") or "").strip()
    category = (data.get("category") or "").strip()
    location = (data.get("location") or "").strip()
    phone = (data.get("phone") or "").strip()
    email = (data.get("email") or "").strip()
    primary_crops = (data.get("primary_crops") or "").strip()
    photo_url = (data.get("photo_url") or "/images/farmer_elena_portrait_1793189251653.jpg").strip()
    bio = (data.get("bio") or "").strip()

    if not full_name or not category or not location or not phone:
        return jsonify({"error": "Farmer name, category, location, and phone are required."}), 400

    try:
        farm_size_ha = float(data.get("farm_size_ha", 1.0))
    except (TypeError, ValueError):
        return jsonify({"error": "Farm size must be a valid number."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            INSERT INTO farmers
              (full_name, category, location, phone, email, farm_size_ha, primary_crops, photo_url, bio)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (full_name, category, location, phone, email, farm_size_ha, primary_crops, photo_url, bio),
        )
        new_id = cursor.lastrowid
        log_activity(
            cursor,
            "Farmer",
            f"Registered farmer profile for {full_name} ({location}).",
            get_actor_name(),
        )
        conn.commit()

        cursor.execute("SELECT * FROM farmers WHERE id = %s", (new_id,))
        created = serialize_row(cursor.fetchone())
        cursor.close()
        conn.close()
        return jsonify(created), 201
    except Error as err:
        return jsonify({"error": format_mysql_error(err)}), 500


@app.route("/api/farmers/<int:farmer_id>", methods=["PUT"])
@login_required
def update_farmer(farmer_id):
    data = request.get_json(silent=True) or {}
    full_name = (data.get("full_name") or "").strip()
    category = (data.get("category") or "").strip()
    location = (data.get("location") or "").strip()
    phone = (data.get("phone") or "").strip()
    email = (data.get("email") or "").strip()
    primary_crops = (data.get("primary_crops") or "").strip()
    photo_url = (data.get("photo_url") or "/images/farmer_elena_portrait_1793189251653.jpg").strip()
    bio = (data.get("bio") or "").strip()

    if not full_name or not category or not location or not phone:
        return jsonify({"error": "Farmer name, category, location, and phone are required."}), 400

    try:
        farm_size_ha = float(data.get("farm_size_ha", 1.0))
    except (TypeError, ValueError):
        return jsonify({"error": "Farm size must be a valid number."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            UPDATE farmers
            SET full_name=%s, category=%s, location=%s, phone=%s, email=%s,
                farm_size_ha=%s, primary_crops=%s, photo_url=%s, bio=%s
            WHERE id=%s
            """,
            (full_name, category, location, phone, email, farm_size_ha, primary_crops, photo_url, bio, farmer_id),
        )
        log_activity(
            cursor,
            "Farmer",
            f"Updated farmer profile for {full_name}.",
            get_actor_name(),
        )
        conn.commit()

        cursor.execute("SELECT * FROM farmers WHERE id = %s", (farmer_id,))
        updated = serialize_row(cursor.fetchone())
        cursor.close()
        conn.close()
        return jsonify(updated)
    except Error as err:
        return jsonify({"error": format_mysql_error(err)}), 500


@app.route("/api/farmers/<int:farmer_id>", methods=["DELETE"])
@login_required
def delete_farmer(farmer_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT full_name FROM farmers WHERE id = %s", (farmer_id,))
        existing = cursor.fetchone()
        if not existing:
            cursor.close()
            conn.close()
            return jsonify({"error": "Farmer record not found."}), 404

        cursor.execute("DELETE FROM farmers WHERE id = %s", (farmer_id,))
        log_activity(
            cursor,
            "Farmer",
            f"Deleted farmer record for {existing['full_name']}.",
            get_actor_name(),
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Farmer deleted successfully."})
    except Error as err:
        return jsonify({"error": format_mysql_error(err)}), 500


# ============================================================================
# 5. RESOURCE EXCHANGE CRUD & REQUEST ROUTES (/api/listings)
# ============================================================================
@app.route("/api/listings", methods=["GET"])
@login_required
def get_listings():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT l.*, f.full_name AS farmer_name, f.category AS farmer_category, f.phone AS farmer_phone
            FROM exchange_listings l
            JOIN farmers f ON l.farmer_id = f.id
            ORDER BY l.id DESC
            """
        )
        rows = [serialize_row(r) for r in cursor.fetchall()]
        cursor.close()
        conn.close()
        return jsonify(rows)
    except Error as err:
        return jsonify({"error": format_mysql_error(err)}), 500


@app.route("/api/listings", methods=["POST"])
@login_required
def create_listing():
    data = request.get_json(silent=True) or {}
    item_name = (data.get("item_name") or "").strip()
    category = (data.get("category") or "").strip()
    unit = (data.get("unit") or "").strip()
    location = (data.get("location") or "").strip()
    desired_exchange = (data.get("desired_exchange") or "").strip()
    description = (data.get("description") or "").strip()
    photo_url = (data.get("photo_url") or "/images/resource_seeds_burlap_1793189254613.jpg").strip()
    status = (data.get("status") or "Available").strip()

    try:
        farmer_id = int(data.get("farmer_id", 0))
        quantity = float(data.get("quantity", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Farmer selection and quantity must be valid."}), 400

    if not farmer_id or not item_name or not unit or not location or not desired_exchange or quantity <= 0:
        return jsonify({"error": "Please complete all required listing fields with a positive quantity."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            INSERT INTO exchange_listings
              (farmer_id, item_name, category, quantity, unit, location, desired_exchange, description, photo_url, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (farmer_id, item_name, category, quantity, unit, location, desired_exchange, description, photo_url, status),
        )
        new_id = cursor.lastrowid
        log_activity(
            cursor,
            "Listing",
            f"Posted exchange listing: {item_name} ({quantity:g} {unit} in {location}).",
            get_actor_name(),
        )
        conn.commit()

        cursor.execute(
            """
            SELECT l.*, f.full_name AS farmer_name, f.category AS farmer_category, f.phone AS farmer_phone
            FROM exchange_listings l
            JOIN farmers f ON l.farmer_id = f.id
            WHERE l.id = %s
            """,
            (new_id,),
        )
        created = serialize_row(cursor.fetchone())
        cursor.close()
        conn.close()
        return jsonify(created), 201
    except Error as err:
        return jsonify({"error": format_mysql_error(err)}), 500


@app.route("/api/listings/<int:listing_id>", methods=["PUT"])
@login_required
def update_listing(listing_id):
    data = request.get_json(silent=True) or {}
    item_name = (data.get("item_name") or "").strip()
    category = (data.get("category") or "").strip()
    unit = (data.get("unit") or "").strip()
    location = (data.get("location") or "").strip()
    desired_exchange = (data.get("desired_exchange") or "").strip()
    description = (data.get("description") or "").strip()
    photo_url = (data.get("photo_url") or "/images/resource_seeds_burlap_1793189254613.jpg").strip()
    status = (data.get("status") or "Available").strip()

    try:
        farmer_id = int(data.get("farmer_id", 0))
        quantity = float(data.get("quantity", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Farmer selection and quantity must be valid."}), 400

    if not farmer_id or not item_name or not unit or not location or not desired_exchange:
        return jsonify({"error": "Please complete all required listing fields."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            UPDATE exchange_listings
            SET farmer_id=%s, item_name=%s, category=%s, quantity=%s, unit=%s,
                location=%s, desired_exchange=%s, description=%s, photo_url=%s, status=%s
            WHERE id=%s
            """,
            (farmer_id, item_name, category, quantity, unit, location, desired_exchange, description, photo_url, status, listing_id),
        )
        log_activity(
            cursor,
            "Listing",
            f"Updated exchange listing '{item_name}' ({status}).",
            get_actor_name(),
        )
        conn.commit()

        cursor.execute(
            """
            SELECT l.*, f.full_name AS farmer_name, f.category AS farmer_category, f.phone AS farmer_phone
            FROM exchange_listings l
            JOIN farmers f ON l.farmer_id = f.id
            WHERE l.id = %s
            """,
            (listing_id,),
        )
        updated = serialize_row(cursor.fetchone())
        cursor.close()
        conn.close()
        return jsonify(updated)
    except Error as err:
        return jsonify({"error": format_mysql_error(err)}), 500


@app.route("/api/listings/<int:listing_id>", methods=["DELETE"])
@login_required
def delete_listing(listing_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT item_name FROM exchange_listings WHERE id = %s", (listing_id,))
        existing = cursor.fetchone()
        if not existing:
            cursor.close()
            conn.close()
            return jsonify({"error": "Listing not found."}), 404

        cursor.execute("DELETE FROM exchange_listings WHERE id = %s", (listing_id,))
        log_activity(
            cursor,
            "Listing",
            f"Removed exchange listing '{existing['item_name']}'.",
            get_actor_name(),
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Listing deleted successfully."})
    except Error as err:
        return jsonify({"error": format_mysql_error(err)}), 500


@app.route("/api/listings/<int:listing_id>/request", methods=["POST"])
@login_required
def request_exchange(listing_id):
    """Create a new Transaction from a Resource Exchange listing request."""
    data = request.get_json(silent=True) or {}
    requester_farmer = (data.get("requester_farmer") or "").strip()
    exchange_details = (data.get("exchange_details") or "").strip()
    notes = (data.get("notes") or "").strip()
    tx_date = (data.get("transaction_date") or date.today().isoformat()).strip()

    try:
        req_qty = float(data.get("quantity", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Requested quantity must be a valid number."}), 400

    if not requester_farmer or not exchange_details or req_qty <= 0:
        return jsonify({"error": "Requester farmer, offered exchange item, and positive quantity are required."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT l.*, f.full_name AS farmer_name
            FROM exchange_listings l
            JOIN farmers f ON l.farmer_id = f.id
            WHERE l.id = %s
            """,
            (listing_id,),
        )
        listing = cursor.fetchone()
        if not listing:
            cursor.close()
            conn.close()
            return jsonify({"error": "Exchange listing not found."}), 404

        cursor.execute("SELECT COUNT(*) AS count FROM transactions")
        next_num = 101 + cursor.fetchone()["count"]
        tx_code = f"DL-{date.today().year}-{next_num}"

        cursor.execute(
            """
            INSERT INTO transactions
              (transaction_code, listing_id, item_name, provider_farmer, requester_farmer,
               quantity, unit, exchange_details, transaction_date, status, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'Pending', %s)
            """,
            (
                tx_code,
                listing_id,
                listing["item_name"],
                listing["farmer_name"],
                requester_farmer,
                req_qty,
                listing["unit"],
                exchange_details,
                tx_date,
                notes,
            ),
        )
        new_tx_id = cursor.lastrowid

        remaining = max(0.0, float(listing["quantity"]) - req_qty)
        new_listing_status = "Reserved" if remaining == 0 else listing["status"]
        cursor.execute(
            "UPDATE exchange_listings SET status = %s WHERE id = %s",
            (new_listing_status, listing_id),
        )

        log_activity(
            cursor,
            "Transaction",
            f"Exchange request {tx_code}: {requester_farmer} requested {req_qty:g} {listing['unit']} of {listing['item_name']}.",
            get_actor_name(),
        )
        conn.commit()

        cursor.execute("SELECT * FROM transactions WHERE id = %s", (new_tx_id,))
        created_tx = serialize_row(cursor.fetchone())
        cursor.close()
        conn.close()
        return jsonify(created_tx), 201
    except Error as err:
        return jsonify({"error": format_mysql_error(err)}), 500


# ============================================================================
# 6. TRANSACTIONS CRUD ROUTES (/api/transactions)
# ============================================================================
@app.route("/api/transactions", methods=["GET"])
@login_required
def get_transactions():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM transactions ORDER BY id DESC")
        rows = [serialize_row(r) for r in cursor.fetchall()]
        cursor.close()
        conn.close()
        return jsonify(rows)
    except Error as err:
        return jsonify({"error": format_mysql_error(err)}), 500


@app.route("/api/transactions", methods=["POST"])
@login_required
def create_transaction():
    data = request.get_json(silent=True) or {}
    item_name = (data.get("item_name") or "").strip()
    provider_farmer = (data.get("provider_farmer") or "").strip()
    requester_farmer = (data.get("requester_farmer") or "").strip()
    unit = (data.get("unit") or "units").strip()
    exchange_details = (data.get("exchange_details") or "").strip()
    tx_date = (data.get("transaction_date") or date.today().isoformat()).strip()
    status = (data.get("status") or "Pending").strip()
    notes = (data.get("notes") or "").strip()

    try:
        quantity = float(data.get("quantity", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Quantity must be a valid number."}), 400

    if not item_name or not provider_farmer or not requester_farmer or not exchange_details or quantity <= 0:
        return jsonify({"error": "Please fill in all required transaction fields."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) AS count FROM transactions")
        next_num = 101 + cursor.fetchone()["count"]
        tx_code = data.get("transaction_code") or f"DL-{date.today().year}-{next_num}"

        cursor.execute(
            """
            INSERT INTO transactions
              (transaction_code, item_name, provider_farmer, requester_farmer,
               quantity, unit, exchange_details, transaction_date, status, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (tx_code, item_name, provider_farmer, requester_farmer, quantity, unit, exchange_details, tx_date, status, notes),
        )
        new_id = cursor.lastrowid
        log_activity(
            cursor,
            "Transaction",
            f"Recorded transaction {tx_code} ({status}) between {provider_farmer} and {requester_farmer}.",
            get_actor_name(),
        )
        conn.commit()

        cursor.execute("SELECT * FROM transactions WHERE id = %s", (new_id,))
        created = serialize_row(cursor.fetchone())
        cursor.close()
        conn.close()
        return jsonify(created), 201
    except Error as err:
        return jsonify({"error": format_mysql_error(err)}), 500


@app.route("/api/transactions/<int:tx_id>", methods=["PUT"])
@login_required
def update_transaction(tx_id):
    data = request.get_json(silent=True) or {}
    item_name = (data.get("item_name") or "").strip()
    provider_farmer = (data.get("provider_farmer") or "").strip()
    requester_farmer = (data.get("requester_farmer") or "").strip()
    unit = (data.get("unit") or "units").strip()
    exchange_details = (data.get("exchange_details") or "").strip()
    tx_date = (data.get("transaction_date") or date.today().isoformat()).strip()
    status = (data.get("status") or "Pending").strip()
    notes = (data.get("notes") or "").strip()

    try:
        quantity = float(data.get("quantity", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Quantity must be a valid number."}), 400

    if not item_name or not provider_farmer or not requester_farmer or not exchange_details or quantity <= 0:
        return jsonify({"error": "Please fill in all required transaction fields."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            UPDATE transactions
            SET item_name=%s, provider_farmer=%s, requester_farmer=%s, quantity=%s,
                unit=%s, exchange_details=%s, transaction_date=%s, status=%s, notes=%s
            WHERE id=%s
            """,
            (item_name, provider_farmer, requester_farmer, quantity, unit, exchange_details, tx_date, status, notes, tx_id),
        )

        cursor.execute("SELECT * FROM transactions WHERE id = %s", (tx_id,))
        updated = serialize_row(cursor.fetchone())

        if updated and status == "Completed" and updated.get("listing_id"):
            cursor.execute(
                "UPDATE exchange_listings SET status = 'Exchanged' WHERE id = %s",
                (updated["listing_id"],),
            )

        log_activity(
            cursor,
            "Transaction",
            f"Updated transaction {updated['transaction_code'] if updated else tx_id} status to {status}.",
            get_actor_name(),
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify(updated)
    except Error as err:
        return jsonify({"error": format_mysql_error(err)}), 500


@app.route("/api/transactions/<int:tx_id>", methods=["DELETE"])
@login_required
def delete_transaction(tx_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT transaction_code FROM transactions WHERE id = %s", (tx_id,))
        existing = cursor.fetchone()
        if not existing:
            cursor.close()
            conn.close()
            return jsonify({"error": "Transaction record not found."}), 404

        cursor.execute("DELETE FROM transactions WHERE id = %s", (tx_id,))
        log_activity(
            cursor,
            "Transaction",
            f"Deleted transaction record {existing['transaction_code']}.",
            get_actor_name(),
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Transaction deleted successfully."})
    except Error as err:
        return jsonify({"error": format_mysql_error(err)}), 500


if __name__ == "__main__":
    try:
        initialize_database_from_sql_file()
    except Error as startup_err:
        print(f"\n[DALOY MYSQL WARNING] {format_mysql_error(startup_err)}\n")
    print("=================================================================")
    print("  DALOY — Farm Resources in Motion")
    print("  Open this exact link in your browser: http://127.0.0.1:5000")
    print("  (Do NOT use port 5500 / VS Code Go Live alone)")
    print("=================================================================")
    app.run(host="127.0.0.1", port=5000, debug=True)
