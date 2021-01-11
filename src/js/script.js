var app = new Vue({
  el: "#app",
  data: {
    search: "",
    villeResult: ["nice"],
    refreshToken: "5ff42209e96a29259352e9e5|23970a20e1d8ff67d5b4f7bc06069383",
  },
  methods: {
    toggleSidebar: function () {
      let pageWrapper = document.getElementsByClassName("page-wrapper")[0];
      if (pageWrapper) {
        if (pageWrapper.getAttribute("data-sidebar-hidden")) {
          pageWrapper.removeAttribute("data-sidebar-hidden");
        } else {
          pageWrapper.setAttribute("data-sidebar-hidden", "hidden");
        }
      }
    },
    toggleDarkMode: function () {
      halfmoon.toggleDarkMode();
    },
    updateAccessToken: async function () {
      var myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

      var urlencoded = new URLSearchParams();
      urlencoded.append("grant_type", "refresh_token");
      urlencoded.append("refresh_token", this.refreshToken);
      urlencoded.append("client_id", "5ff42c27aa535449705e170e");
      urlencoded.append(
        "client_secret",
        "LoGATpdHCIsYi2eCpk5BMqiQlRmtGQHfdAiCR9AorFFI"
      );

      var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: urlencoded,
        redirect: "follow",
      };

      let req = await fetch(
        "https://api.netatmo.com/oauth2/token",
        requestOptions
      );
      let rep = await req.json();
      await localStorage.setItem("access_token", rep.access_token);
    },

    autocomplete: async function(){

      let req = await fetch('https://nominatim.openstreetmap.org/search.php?street='+this.search+'&format=json');

          let rep = await req.json();

          await rep.map((place)=>{
            console.log(place.display_name)
          })

    }
  },
  mounted: function () {
    this.villeResult.map((v) => console.log(v));
    if (!localStorage.getItem("access_token")) {
      this.updateAccessToken();
    }
  },
});

var map = L.map("map").setView([51.505, -0.09], 13);

L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
  attribution: "",
}).addTo(map);
