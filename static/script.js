// ----------------------------------------------------
// 1) API KEY
// ----------------------------------------------------


// ----------------------------------------------------
// 2) VERİLERİ TUTACAĞIMIZ ARRAY'LER
// ----------------------------------------------------

// API'den gelen tarifleri burada tutacağız
let tarifler = [];

// Popüler tarifler listesini burada tutacağız
let populerListesi = [];

// Henüz hiç favori yokken gösterilen "Öne Çıkan Tarifler" listesi
let oneCikanListesi = [];

// Favoriye eklenen tarifleri artık DB'de tutuyoruz, burada array yok.

//kaç tarif atlanacağını tutacak
let offset =0

//hangi yemeği aradığımızı hatırlayacak
let aktifArama = "pasta"

// ----------------------------------------------------
// 3) HTML ELEMENTLERİNİ SEÇİYORUZ
// ----------------------------------------------------
// Tariflerin gösterileceği alan
const tariflerDiv = document.querySelector("#tarifler");
// Favorilerin gösterileceği alan
const favorilerDiv = document.querySelector("#favoriler");
// Arama inputu
const aramaInput = document.querySelector("#aramaInput");
// Ara butonu
const araButon = document.querySelector("#araButon");
// Tarifler ve Favoriler sayfa bölümleri
const tarifSayfasi = document.querySelector("#tarifSayfasi");

const favoriSayfasi = document.querySelector("#favoriSayfasi");

const dahaFazlaButon = document.querySelector("#dahaFazlaButon")

const dahaFazlaAlani = document.querySelector(".daha-fazla-alani");

// Popüler tarifler alanı (sayfa ilk açıldığında görünen bölüm)
const populerAlani = document.querySelector("#populerAlani");

const populerBaslik = document.querySelector("#populerBaslik");

const populerTariflerDiv = document.querySelector("#populerTarifler");

// Üst menü butonları
const tariflerButon = document.querySelector("#tariflerButon");

const favorilerButon = document.querySelector("#favorilerButon");


// İstatistik alanları
const favoriSayisi = document.querySelector("#favoriSayisi");

const toplamKalori = document.querySelector("#toplamKalori");

const ortalamaKalori = document.querySelector("#ortalamaKalori");

// AI Tarif Asistanı elementleri
const aiMesajInput = document.querySelector("#aiMesajInput");
const aiSorButon = document.querySelector("#aiSorButon");
const aiCevap = document.querySelector("#aiCevap");

dahaFazlaButon.addEventListener("click", function(){

 offset = offset + 12;
 tarifleriGetir(aktifArama,false)

})
 

// ----------------------------------------------------
// 4) API'DEN TARİF GETİRME
// ----------------------------------------------------

function tarifleriGetir(arananYemek,yeniArama) {

  if (yeniArama){
     offset = 0;

    aktifArama =arananYemek;

    // Gerçek bir arama başladı: popüler bölümünü gizle, sonuç alanını göster
    populerAlani.classList.add("gizli");
    tariflerDiv.classList.remove("gizli");
    dahaFazlaAlani.classList.remove("gizli");

    //API cevabı gelene kadar kulllanıcıya bilgi gösteriyoruz
    tariflerDiv.innerHTML ="<p> Yükleniyor...<p>";

  }

  

  fetch(`/api/tarifler?query=${arananYemek}&offset=${offset}`)// spoonaculara git demiyor kendi flask serverimizdeki api/tarifler endpointe git

    .then(function(response) {

      // API cevabı başarılı değilse hata oluşturuyoruz
      if (!response.ok) {
        throw new Error("API isteği başarısız oldu.");
      }

      // Gelen cevabı JSON'a çeviriyoruz
      return response.json();
    })

    .then(function(data) {

      // API'den gelen tarifleri kendi array'imize aktarıyoruz
      const yeniTarifler = data.results;

      if (yeniArama){

        tarifler= yeniTarifler
         //API den hiç tarif gelmediyse
        if (tarifler.length===0){

           tariflerDiv.innerHTML ="<p> Tarif bulunamadı </p>";
          
           return;
        }
      


      //varsa normal şekilde göster
      tarifleriGoster(tarifler, true);
    } else {

      tarifler = tarifler.concat(yeniTarifler);

      tarifleriGoster(yeniTarifler,false);


    }
 })
    .catch(function(hata){
      tariflerDiv.innerHTML ="<p> Bir hata oluştu lütfen tekrar deneyiniz </p>"
      console.log("Hata:",hata)
    })
  }

// ----------------------------------------------------
// 5) TARİFLERİ EKRANDA GÖSTERME
// ----------------------------------------------------

function tarifleriGoster(liste,temizle) {

  if (temizle){
    tariflerDiv.innerHTML ="";
  }


  // Listedeki tarifleri tek tek geziyoruz
  liste.forEach(function(tarif) {

    // Tarifin kalorisini bulmak için değişken oluşturuyoruz
    let kalori = 0;


    // Eğer tarifte nutrition bilgisi varsa
    if (tarif.nutrition) {

      // nutrition içindeki nutrients array'inde
      // adı "Calories" olan değeri buluyoruz
      const kaloriBilgisi = tarif?.nutrition?.nutrients.find(function(besin) {

        return besin.name === "Calories";

      });


      // Kalori bilgisi bulunduysa değerini alıyoruz
      if (kaloriBilgisi) {

        kalori = kaloriBilgisi.amount;

      }
    }


    // Tarif kartını HTML'e ekliyoruz
    tariflerDiv.innerHTML += `
      <div class="tarif-karti">

        <img src="${tarif.image}" alt="${tarif.title}">

        <h3>${tarif.title}</h3>

        <p>
          Hazırlama Süresi:
          ${tarif.readyInMinutes} dakika
        </p>

        <p>
          Kalori:
          ${Math.round(kalori)} kcal
        </p>

        <button onclick="favoriyeEkle(${tarif.id}, this)">
          Favoriye Ekle ❤️
        </button>

      </div>
    `;
  });
}


// ----------------------------------------------------
// 5B) POPÜLER TARİFLERİ GETİRME VE GÖSTERME
// ----------------------------------------------------

function populerTarifleriGetir() {

  fetch("/api/populer-tarifler")
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {

      if (data.length > 0) {
        // Gerçek favori verisi var: "En Çok Favorilenen" olarak göster
        populerBaslik.innerHTML = "En Çok Favorilenen Tarifler ⭐";
        populerListesi = data;
        gercekPopulerleriGoster(data);
      } else {
        // Henüz kimse favori eklememiş: sabit bir "Öne Çıkan" listesine düş
        populerBaslik.innerHTML = "Öne Çıkan Tarifler";
        oneCikanlariGetir();
      }
    })
    .catch(function(hata) {
      console.log("Popüler tarifler yüklenirken hata:", hata);
    });
}


function gercekPopulerleriGoster(data) {

  populerTariflerDiv.innerHTML = "";

  data.forEach(function(tarif) {
    populerTariflerDiv.innerHTML += `
      <div class="tarif-karti">

        <img src="${tarif.gorsel_url}" alt="${tarif.baslik}">

        <h3>${tarif.baslik}</h3>

        <p>${tarif.hazirlama_suresi} dakika</p>

        <p>${Math.round(tarif.kalori)} kcal</p>

        <p class="favori-sayaci">${tarif.favori_sayisi} kişi favoriledi ⭐</p>

        <button onclick="populerFavoriyeEkle(${tarif.tarif_id}, this)">
          Favoriye Ekle ❤️
        </button>

      </div>
    `;
  });
}


// Henüz favori yokken gösterilecek sabit "Öne Çıkan Tarifler" listesi.
// Spoonacular'dan normal arama gibi çekiyoruz, sadece farklı bir alana basıyoruz.
function oneCikanlariGetir() {

  const sabitArama = "pasta";

  fetch(`/api/tarifler?query=${sabitArama}&offset=0`)
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {

      const sonuclar = data.results || [];
      oneCikanListesi = sonuclar;

      populerTariflerDiv.innerHTML = "";

      sonuclar.forEach(function(tarif) {

        let kalori = 0;
        if (tarif.nutrition) {
          const kaloriBilgisi = tarif.nutrition.nutrients.find(function(besin) {
            return besin.name === "Calories";
          });
          if (kaloriBilgisi) {
            kalori = kaloriBilgisi.amount;
          }
        }

        populerTariflerDiv.innerHTML += `
          <div class="tarif-karti">

            <img src="${tarif.image}" alt="${tarif.title}">

            <h3>${tarif.title}</h3>

            <p>${tarif.readyInMinutes} dakika</p>

            <p>${Math.round(kalori)} kcal</p>

            <button onclick="oneCikanFavoriyeEkle(${tarif.id}, this)">
              Favoriye Ekle ❤️
            </button>

          </div>
        `;
      });
    })
    .catch(function(hata) {
      console.log("Öne çıkan tarifler yüklenirken hata:", hata);
    });
}


// ----------------------------------------------------
// 6) ARAMA YAPMA
// ----------------------------------------------------

/*Ara butonuna basıldığında çalışır
araButon.addEventListener("click", function() {

  // Inputun içindeki yazıyı alıyoruz
  const arananYemek = aramaInput.value;


  // Eğer input boş değilse API'ye istek gönderiyoruz
  if (arananYemek !== "") {

    tarifleriGetir(arananYemek);

  }
});*/




// ----------------------------------------------------
// DİNAMİK ARAMA - DEBOUNCE
// ----------------------------------------------------

// setTimeout'ın id bilgisini burada tutacağız.
// Böylece kullanıcı yeni harf yazdığında önceki beklemeyi iptal edebiliriz.
let zamanlayici;


// Kullanıcı inputa her harf yazdığında bu event çalışır.
aramaInput.addEventListener("input", function() {

  // Önce daha önce başlatılmış bir zamanlayıcı varsa iptal ediyoruz.
  // Böylece her harfte API'ye ayrı istek gitmesini engelliyoruz.
  clearTimeout(zamanlayici);


  // Inputun içindeki mevcut yazıyı alıyoruz.
  const arananYemek = aramaInput.value;


  // Yeni bir zamanlayıcı başlatıyoruz.
  // Kullanıcı 500 ms boyunca yeni bir şey yazmazsa içindeki kod çalışır.
  zamanlayici = setTimeout(function() {

    // Çok kısa aramalarda gereksiz API isteği gitmesin diye
    // en az 2 karakter şartı koyuyoruz.
    if (arananYemek.length >= 2) {

      // Kullanıcının yazdığı kelimeyi API'ye gönderiyoruz.
      tarifleriGetir(arananYemek,true);

    }

  }, 500);

});


// Enter tuşuyla da arama yapılabilsin
aramaInput.addEventListener("keydown", function(event) {

  if (event.key === "Enter") {

    const arananYemek = aramaInput.value;

    // Dinamik aramadan kalan zamanlayıcıyı iptal ediyoruz
    clearTimeout(zamanlayici);


    if (arananYemek !== "") {

      tarifleriGetir(arananYemek);

    }
  }
});


// ----------------------------------------------------
// 7) FAVORİYE EKLEME (artık backend'e POST atıyor)
// ----------------------------------------------------

// Arama sonuçlarındaki bir tarifi favoriye eklerken çağrılır
function favoriyeEkle(tarifId, buton) {

  // API'den gelen tarifler içinde seçilen tarifi buluyoruz
  const secilenTarif = tarifler.find(function(tarif) {
    return tarif.id === tarifId;
  });

  if (!secilenTarif) {
    return;
  }

  // Kalori bilgisini buluyoruz
  let kalori = 0;
  if (secilenTarif.nutrition) {
    const kaloriBilgisi = secilenTarif.nutrition.nutrients.find(function(besin) {
      return besin.name === "Calories";
    });
    if (kaloriBilgisi) {
      kalori = kaloriBilgisi.amount;
    }
  }

  favoriyeEklePOST({
    tarif_id: secilenTarif.id,
    baslik: secilenTarif.title,
    gorsel_url: secilenTarif.image,
    kalori: Math.round(kalori),
    hazirlama_suresi: secilenTarif.readyInMinutes
  }, buton);
}


// Popüler tarifler listesindeki bir tarifi favoriye eklerken çağrılır
// (bu kartlarda zaten nutrition ayrıştırmaya gerek yok, veri hazır)
function populerFavoriyeEkle(tarifId, buton) {

  const secilen = populerListesi.find(function(tarif) {
    return tarif.tarif_id === tarifId;
  });

  if (!secilen) {
    return;
  }

  favoriyeEklePOST({
    tarif_id: secilen.tarif_id,
    baslik: secilen.baslik,
    gorsel_url: secilen.gorsel_url,
    kalori: secilen.kalori,
    hazirlama_suresi: secilen.hazirlama_suresi
  }, buton);
}


// "Öne Çıkan Tarifler" (henüz favori yokken gösterilen sabit liste) için
function oneCikanFavoriyeEkle(tarifId, buton) {

  const secilen = oneCikanListesi.find(function(tarif) {
    return tarif.id === tarifId;
  });

  if (!secilen) {
    return;
  }

  let kalori = 0;
  if (secilen.nutrition) {
    const kaloriBilgisi = secilen.nutrition.nutrients.find(function(besin) {
      return besin.name === "Calories";
    });
    if (kaloriBilgisi) {
      kalori = kaloriBilgisi.amount;
    }
  }

  favoriyeEklePOST({
    tarif_id: secilen.id,
    baslik: secilen.title,
    gorsel_url: secilen.image,
    kalori: Math.round(kalori),
    hazirlama_suresi: secilen.readyInMinutes
  }, buton);
}


// Her iki durumda da kullanılan ortak fonksiyon:
// backend'e POST atar, başarılıysa butonu ve kartı görsel olarak günceller
function favoriyeEklePOST(veri, buton) {

  const kart = buton.closest(".tarif-karti");
  const eskiYazi = buton.innerHTML;

  fetch("/api/favoriler", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(veri)
  })
    .then(function(response) {
      // Giriş yapılmamışsa backend 401 döner, login'e yönlendiriyoruz
      if (response.status === 401) {
        window.location.href = "/login";
        return null;
      }
      return response.json();
    })
    .then(function(data) {

      if (!data) {
        return;
      }

      // Görsel geri bildirim: buton metnini değiştir, kartı hafifçe zıplat
      buton.innerHTML = (data.message === "Zaten favorilerde") ? "Zaten Favoride" : "Eklendi ✓";
      buton.classList.add("eklendi");
      kart.classList.add("pulse");

      setTimeout(function() {
        buton.innerHTML = eskiYazi;
        buton.classList.remove("eklendi");
        kart.classList.remove("pulse");
      }, 1500);

      // Favoriler sekmesi açıksa listeyi tazele
      if (!favoriSayfasi.classList.contains("gizli")) {
        favorileriGoster();
      }
    })
    .catch(function(hata) {
      console.log("Favoriye eklenirken hata:", hata);
    });
}


// ----------------------------------------------------
// 8) FAVORİLERİ EKRANDA GÖSTERME (artık backend'den GET ile çekiyor)
// ----------------------------------------------------

function favorileriGoster() {

  fetch("/api/favoriler")
    .then(function(response) {
      if (response.status === 401) {
        window.location.href = "/login";
        return null;
      }
      return response.json();
    })
    .then(function(favoriler) {

      if (!favoriler) {
        return;
      }

      // Önce eski favori görüntüsünü temizliyoruz
      favorilerDiv.innerHTML = "";

      // Favorileri tek tek geziyoruz
      favoriler.forEach(function(tarif) {

        favorilerDiv.innerHTML += `
          <div class="tarif-karti">

            <img src="${tarif.gorsel_url}" alt="${tarif.baslik}">

            <h3>${tarif.baslik}</h3>

            <p>
              ${tarif.hazirlama_suresi} dakika
            </p>

            <p>
              ${Math.round(tarif.kalori)} kcal
            </p>

            <button onclick="favoridenSil(${tarif.tarif_id})">
              Favoriden Sil
            </button>

          </div>
        `;
      });

      // Favori sayısını gösteriyoruz
      favoriSayisi.innerHTML = favoriler.length;

      // Favorilerin toplam kalorisini reduce() ile hesaplıyoruz
      const kaloriToplami = favoriler.reduce(function(toplam, tarif) {
        return toplam + tarif.kalori;
      }, 0);

      // Toplam kaloriyi HTML'e yazıyoruz
      toplamKalori.innerHTML = Math.round(kaloriToplami);

      // Favori yoksa 0 gösteriyoruz
      if (favoriler.length === 0) {
        ortalamaKalori.innerHTML = 0;
      } else {
        // Ortalama = toplam kalori / favori sayısı
        const ortalama = kaloriToplami / favoriler.length;
        ortalamaKalori.innerHTML = Math.round(ortalama);
      }
    })
    .catch(function(hata) {
      console.log("Favoriler yüklenirken hata:", hata);
    });
}


// ----------------------------------------------------
// 9) FAVORİDEN SİLME (artık backend'e DELETE atıyor)
// ----------------------------------------------------

function favoridenSil(tarifId) {

  fetch(`/api/favoriler/${tarifId}`, { method: "DELETE" })
    .then(function(response) {
      if (response.status === 401) {
        window.location.href = "/login";
        return null;
      }
      return response.json();
    })
    .then(function() {
      // Favorileri yeniden gösteriyoruz
      favorileriGoster();
    })
    .catch(function(hata) {
      console.log("Favoriden silinirken hata:", hata);
    });
}


// ----------------------------------------------------
// 10) SAYFA GEÇİŞLERİ
// ----------------------------------------------------

// Tarifler butonuna basıldığında
tariflerButon.addEventListener("click", function() {

  // Tarifler bölümünü gösteriyoruz
  tarifSayfasi.classList.remove("gizli");


  // Favoriler bölümünü gizliyoruz
  favoriSayfasi.classList.add("gizli");

});


// Favoriler butonuna basıldığında
favorilerButon.addEventListener("click", function() {

  // Tarifleri gizliyoruz
  tarifSayfasi.classList.add("gizli");


  // Favorileri gösteriyoruz
  favoriSayfasi.classList.remove("gizli");


  // Favori listesini güncelliyoruz
  favorileriGoster();

});


// ----------------------------------------------------
// 11) SAYFA İLK AÇILDIĞINDA
// ----------------------------------------------------

// Artık rastgele bir arama yerine en çok favorilenen tarifleri gösteriyoruz
populerTarifleriGetir();


// ----------------------------------------------------
// 12) AI TARİF ASİSTANI
// ----------------------------------------------------

function aiOnerisiniIste() {

  const mesaj = aiMesajInput.value.trim();

  if (!mesaj) {
    return;
  }

  aiCevap.classList.remove("gizli");
  aiCevap.innerHTML = "Düşünüyor...";

  fetch("/api/ai-tarif-onerisi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mesaj: mesaj })
  })
    .then(function(response) {
      if (response.status === 401) {
        window.location.href = "/login";
        return null;
      }
      return response.json();
    })
    .then(function(data) {

      if (!data) {
        return;
      }

      if (data.error) {
        aiCevap.innerHTML = data.error;
        return;
      }

      // AI'nin önerisini kullanıcıya gösteriyoruz
      aiCevap.innerHTML = data.aciklama || "";

      // AI'nin bulduğu arama terimiyle mevcut arama akışını tetikliyoruz
      aramaInput.value = data.arama_terimi;
      tarifleriGetir(data.arama_terimi, true);
    })
    .catch(function(hata) {
      aiCevap.innerHTML = "Bir hata oluştu, tekrar dene.";
      console.log("AI asistanı hatası:", hata);
    });
}

aiSorButon.addEventListener("click", aiOnerisiniIste);

// Enter tuşuyla da sorulabilsin
aiMesajInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    aiOnerisiniIste();
  }
});

