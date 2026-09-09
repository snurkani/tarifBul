from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)

    # generate_password_hash() zaten içine rastgele bir salt gömüyor,
    # yani "hashleme + salting" burada tek satırda hallediliyor.
    password_hash = db.Column(db.String(255), nullable=False)

    role = db.Column(db.String(20), default="user")  # "user" ya da "admin"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Bir kullanıcının birden çok favorisi olabilir (1-N ilişki)
    favoriler = db.relationship("Favori", backref="user", lazy=True, cascade="all, delete-orphan")


class Favori(db.Model):
    __tablename__ = "favoriler"

    id = db.Column(db.Integer, primary_key=True)

    # Hangi kullanıcıya ait olduğunu tutan foreign key
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    # Spoonacular'dan gelen tarifin kendi id'si (bizim id'miz değil)
    tarif_id = db.Column(db.Integer, nullable=False)

    baslik = db.Column(db.String(255))
    gorsel_url = db.Column(db.String(500))
    kalori = db.Column(db.Float, default=0)
    hazirlama_suresi = db.Column(db.Integer)

    eklenme_tarihi = db.Column(db.DateTime, default=datetime.utcnow)

    # Aynı kullanıcı aynı tarifi iki kere favoriye ekleyemesin
    __table_args__ = (db.UniqueConstraint("user_id", "tarif_id", name="tekil_favori"),)
