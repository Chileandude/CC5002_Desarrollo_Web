from flask import Blueprint, render_template, Response, url_for

pages_bp = Blueprint("pages", __name__)


@pages_bp.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@pages_bp.route("/list", methods=["GET"])
def list_view():
    return render_template("list.html")


@pages_bp.route("/list/<int:aviso_id>", methods=["GET"])
def list_detail(aviso_id):
    return render_template("detail.html", aviso_id=aviso_id)


@pages_bp.route("/stats", methods=["GET"])
def stats_view():
    return render_template("stats.html")


@pages_bp.route("/routes.js", methods=["GET"])
def routes_js():
    """
    Devuelve un JS con las rutas públicas (window.ROUTES).
      - (None)
    ->
      - ResponseReturnValue — Respuesta con mimetype application/javascript.
    """
    js = f"""window.ROUTES = {{
        home: "{url_for('pages.index')}",
        list: "{url_for('pages.list_view')}",
        stats: "{url_for('pages.stats_view')}"
    }};"""
    return Response(js, mimetype="application/javascript")
