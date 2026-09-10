// ----------------------------------------------------
// 1) API KEY
// ----------------------------------------------------


// ----------------------------------------------------
// 2) VERİLERİ TUTACAĞIMIZ ARRAY'LER
// ----------------------------------------------------

// API'den gelen tarifleri burada tutacağız
let tarifler = [];

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

        <button onclick="favoriyeEkle(${tarif.id})">
          Favoriye Ekle ❤️
        </button>

      </div>
    `;
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

function favoriyeEkle(tarifId) {

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

  fetch("/api/favoriler", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tarif_id: secilenTarif.id,
      baslik: secilenTarif.title,
      gorsel_url: secilenTarif.image,
      kalori: Math.round(kalori),
      hazirlama_suresi: secilenTarif.readyInMinutes
    })
  })
    .then(function(response) {
      // Giriş yapılmamışsa backend 401 döner, login'e yönlendiriyoruz
      if (response.status === 401) {
        window.location.href = "/login";
        return null;
      }
      return response.json();
    })
    .then(function() {
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

// Başlangıçta örnek olarak pasta tariflerini getiriyoruz
tarifleriGetir("pasta",true);


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

