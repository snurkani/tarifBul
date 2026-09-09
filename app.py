from flask import Flask, render_template, request, jsonify
import requests #fetch() yerine requests.get() kullanıyoruz

import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("SPOONACULAR_API_KEY")

app = Flask(__name__)# app server uygulamamız __name__ python un verdiği özel değişken



@app.route("/")#kullanıcı ana adrese gelince bu fonksiyonu çalıştır
def ana_sayfa():#http://127.0.0.1:5000/ adresine gidince fonksiyon çalışr
    return render_template("index.html")

#bu decorator denen yapı def ana_sayfa(): normal fonksiyon
#ama aüstüne @app.route("/") gelirse web adresine bağlanıyor


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


if __name__ == "__main__":
    app.run(debug=True)