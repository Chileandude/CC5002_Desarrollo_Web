from flask import Flask
from .config import Config
from .pages import pages_bp


def create_app():
    app = Flask(__name__, static_folder="static", template_folder="templates")
    app.config.from_object(Config)

    # Blueprints
    app.register_blueprint(pages_bp)

    return app
