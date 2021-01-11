var app = new Vue({
  el: "#app",
  data: {
    search: "",
    villeResult: ["nice"],
    refreshToken: "5ff42209e96a29259352e9e5|23970a20e1d8ff67d5b4f7bc06069383",
    centerMap: [51.505, -0.09],
    map: undefined,
    markers: [],
    stationSelected: {},
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
    getStations: async function () {
      localStorage.setItem("centerMap", [
        this.map.getCenter().lat,
        this.map.getCenter().lng,
      ]);

      var myHeaders = new Headers();
      myHeaders.append(
        "Authorization",
        "Bearer " + localStorage.getItem("access_token")
      );

      let url = new URL("https://app.netatmo.net/api/getpublicmeasures");

      url.search = new URLSearchParams({
        limit: 100,
        zoom: this.map.getZoom(),
        lat_ne: this.map.getBounds()._northEast.lat,
        lon_ne: this.map.getBounds()._northEast.lng,
        lat_sw: this.map.getBounds()._southWest.lat,
        lon_sw: this.map.getBounds()._southWest.lng,
        date_end: "last",
        quality: 7,
      });

      var requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      let req = await fetch(url, requestOptions);
      let rep = await req.json();
      await this.markers.map((marker) => this.map.removeLayer(marker)); // remove all markers
      await rep.body.map((station) => this.displayMarker(station)); // display new markers
    },
    displayMarker: function (station) {
      let marker = L.marker([
        station.place.location[1],
        station.place.location[0],
      ]).addTo(this.map);
      this.markers.push(marker);
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
    this.map = L.map("map").setView(this.centerMap, 13);

    L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
      attribution: "",
    }).addTo(this.map);

    this.map.on("moveend", () => {
      this.getStations();
    });

    if (!localStorage.getItem("access_token")) {
      this.updateAccessToken();
    }

    if (localStorage.getItem("centerMap")) {
      this.centerMap = localStorage.getItem("centerMap");
    }

    this.getStations();
  },
});
