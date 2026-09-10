import os
from functools import wraps

from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
import requests #fetch() yerine requests.get() kullanıyoruz

from models import db, User, Favori

load_dotenv()  # .env dosyasındaki değişkenleri ortam değişkeni olarak yükler

app = Flask(__name__)# app server uygulamamız __name__ python un verdiği özel değişken

app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "gelistirme-icin-gecici-key")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///tarifbul.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

API_KEY = os.environ.get("SPOONACULAR_API_KEY")


# ----------------------------------------------------
# YETKİ KONTROLÜ İÇİN DECORATOR'LAR
# ----------------------------------------------------

def login_required(f):
    """Bu decorator ile işaretlenen route'lara girmeden önce
    kullanıcının session'da user_id'si olup olmadığını kontrol ediyoruz."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated


def api_login_required(f):
    """API route'ları için: yönlendirme yerine JSON + 401 döner,
    böylece frontend fetch() ile bunu düzgün yakalayabilir."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Giriş yapmalısın"}), 401
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """login_required'ın üstüne role kontrolü ekliyor."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if session.get("role") != "admin":
            return "Bu sayfaya erişim yetkin yok.", 403
        return f(*args, **kwargs)
    return decorated


@app.route("/")#kullanıcı ana adrese gelince bu fonksiyonu çalıştır
def ana_sayfa():#http://127.0.0.1:5000/ adresine gidince fonksiyon çalışr
    return render_template("index.html")

#bu decorator denen yapı def ana_sayfa(): normal fonksiyon
#ama aüstüne @app.route("/") gelirse web adresine bağlanıyor


# ----------------------------------------------------
# AUTHENTICATION ROUTE'LARI
# ----------------------------------------------------

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        if not username or not password:
            flash("Kullanıcı adı ve şifre boş bırakılamaz.")
            return redirect(url_for("register"))

        if User.query.filter_by(username=username).first():
            flash("Bu kullanıcı adı zaten alınmış.")
            return redirect(url_for("register"))

        yeni_kullanici = User(
            username=username,
            # generate_password_hash içeride rastgele bir salt üretip
            # şifreyle birleştirip hash'liyor; DB'de düz şifre asla tutulmuyor.
            password_hash=generate_password_hash(password),
            role="user",
        )
        db.session.add(yeni_kullanici)
        db.session.commit()

        flash("Kayıt başarılı, şimdi giriş yapabilirsin.")
        return redirect(url_for("login"))

    return render_template("register.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        kullanici = User.query.filter_by(username=username).first()

        # check_password_hash, DB'deki hash'in içine gömülü olan salt'ı
        # kullanarak girilen şifreyi aynı şekilde hash'leyip karşılaştırıyor.
        if kullanici and check_password_hash(kullanici.password_hash, password):
            session["user_id"] = kullanici.id
            session["username"] = kullanici.username
            session["role"] = kullanici.role
            return redirect(url_for("ana_sayfa"))

        flash("Kullanıcı adı veya şifre hatalı.")
        return redirect(url_for("login"))

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/api/tarifler")#kendi endpointimiz frontend fetch("/api/tarifler?query=pizza") dediğinde bu fonksiyon çalışıyr
def tarifleri_getir():

    # JavaScript'ten gelen query bilgisini alıyoruz
    aranan_yemek = request.args.get("query")

    #const arananYemek = aramaInput.value; => request.args.get("query") aynı mantık urlden veri alıyor
    #URL'den offset depğerini al eğer gönderilmemişse 0 kullan
    offset= request.args.get("offset",0)


    if not aranan_yemek:

        return jsonify({
            "error": "Arama Kelimesi Gerekli"
        }), 400

    url = "https://api.spoonacular.com/recipes/complexSearch"

    params = { #dictionarydir js deki object ile çok benzer key-value
        #spoonaculara hanngi bilgileri gönderecğimzii hazırlyoryz
        "query": aranan_yemek,
        "number": 12,
        "offset":offset,
        "addRecipeInformation": "true",
        "addRecipeNutrition": "true",
        "apiKey": API_KEY
    }

# requests kütüphanesini kullan, url adresine bir GET isteği gönder, 
# params içindeki bilgileri de URL parametresi olarak ekle ve gelen cevabı response değişkenine ko
    response = requests.get(url, params=params)#flask server spoonacular a istek göderiyor


    # eğer spooacular başarıı şekildecevap döndüremediyse 
    #aynı hata kodunu frontenede gönderiyoru
    if response.status_code != 200:
        return jsonify({
            "error":"Spoonacular API isteği baaşarısız oldu"
        }), response.status_code

    data = response.json()# js benzer ama promise döndürmüyor normal sonucu döndürüyor, senkron çalışıyor

    return jsonify(data)# flaskten js ye json cevap döndürüyor


# ----------------------------------------------------
# FAVORİ API ROUTE'LARI (artık DB'ye bağlı, kullanıcıya özel)
# ----------------------------------------------------

@app.route("/api/favoriler", methods=["GET"])
@api_login_required
def favorileri_getir():
    kullanicinin_favorileri = (
        Favori.query.filter_by(user_id=session["user_id"])
        .order_by(Favori.eklenme_tarihi.desc())
        .all()
    )
    return jsonify([
        {
            "tarif_id": f.tarif_id,
            "baslik": f.baslik,
            "gorsel_url": f.gorsel_url,
            "kalori": f.kalori,
            "hazirlama_suresi": f.hazirlama_suresi,
        }
        for f in kullanicinin_favorileri
    ])


@app.route("/api/favoriler", methods=["POST"])
@api_login_required
def favoriye_ekle():
    veri = request.get_json()

    if not veri or "tarif_id" not in veri:
        return jsonify({"error": "tarif_id gerekli"}), 400

    mevcut = Favori.query.filter_by(
        user_id=session["user_id"], tarif_id=veri["tarif_id"]
    ).first()

    if mevcut:
        return jsonify({"message": "Zaten favorilerde"}), 200

    yeni_favori = Favori(
        user_id=session["user_id"],
        tarif_id=veri["tarif_id"],
        baslik=veri.get("baslik"),
        gorsel_url=veri.get("gorsel_url"),
        kalori=veri.get("kalori", 0),
        hazirlama_suresi=veri.get("hazirlama_suresi"),
    )
    db.session.add(yeni_favori)
    db.session.commit()

    return jsonify({"message": "Favorilere eklendi"}), 201


@app.route("/api/favoriler/<int:tarif_id>", methods=["DELETE"])
@api_login_required
def favoriden_sil(tarif_id):
    favori = Favori.query.filter_by(
        user_id=session["user_id"], tarif_id=tarif_id
    ).first()

    if not favori:
        return jsonify({"error": "Favori bulunamadı"}), 404

    db.session.delete(favori)
    db.session.commit()

    return jsonify({"message": "Favorilerden silindi"}), 200


# ----------------------------------------------------
# ADMIN PANELİ
# ----------------------------------------------------

@app.route("/admin")
@login_required
@admin_required
def admin_paneli():
    kullanicilar = User.query.order_by(User.created_at.desc()).all()

    # Tarif bazında favori sayısını grupla (SQL GROUP BY + COUNT)
    populer_tarifler = (
        db.session.query(
            Favori.tarif_id,
            Favori.baslik,
            db.func.count(Favori.id).label("favori_sayisi"),
        )
        .group_by(Favori.tarif_id, Favori.baslik)
        .order_by(db.func.count(Favori.id).desc())
        .limit(10)
        .all()
    )

    return render_template(
        "admin.html",
        kullanicilar=kullanicilar,
        populer_tarifler=populer_tarifler,
    )


if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # Modellerde tanımlı tabloları, yoksa oluşturur
    app.run(debug=True)