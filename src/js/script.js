import Vue from "vue/dist/vue.esm";
import debounce from "lodash/debounce";

var app = new Vue({
  el: "#app",
  data: {
    search: "",
    villeResult: [],
    refreshToken: "5ff42209e96a29259352e9e5|23970a20e1d8ff67d5b4f7bc06069383",
    centerMap: [44.5667, 6.0833],
    zoomMap: 10,
    map: undefined,
    markers: [],
    selectedMarkers: [],
    stationSelected: {},
    searchAbort: undefined,
    currentTiles: undefined,
    currentMapMode: "light",
    mapTiles: {
      light: [
        "https://{s}.tile.osm.org/{z}/{x}/{y}.png",
        {
          attribution: "",
          minNativeZoom: 4,
          minZoom: 4,
        },
      ],
      dark: [
        "https://{s}.tile.jawg.io/jawg-dark/{z}/{x}/{y}{r}.png?access-token={accessToken}",
        {
          accessToken:
            "egxKGnlc7KKhVoPWDwK8F1kMy3SbJUJRYTPnXLy8DxEagNuoQ4WBdBbLO2BqAGa7",
          attribution: "",
          minNativeZoom: 4,
          minZoom: 4,
        },
      ],
    },
    stations: [],
  },
  computed: {
    /**
     * Properties computed to get current average temperature of the zone
     */
    averageTemp: function () {
      let average = 0;
      this.stations.map((station) => {
        average +=
          station.measures[Object.keys(station.measures)[0]].res[
            Object.keys(
              station.measures[Object.keys(station.measures)[0]].res
            )[0]
          ][0];
      });
      return average / this.stations.length;
    },
    /**
     * Properties computed to get current average humidity of the zone
     */
    averageHumid: function () {
      let average = 0;
      this.stations.map((station) => {
        average +=
          station.measures[Object.keys(station.measures)[0]].res[
            Object.keys(
              station.measures[Object.keys(station.measures)[0]].res
            )[0]
          ][1];
      });
      return average / this.stations.length;
    },
  },
  methods: {
    /**
     * halfmoon - display or hidde sidebar
     */
    toggleSidebar: function () {
      let pageWrapper = document.getElementsByClassName("page-wrapper")[0];
      if (pageWrapper) {
        if (pageWrapper.getAttribute("data-sidebar-hidden")) {
          pageWrapper.removeAttribute("data-sidebar-hidden");
          localStorage.setItem("sidebarOpen", true);
        } else {
          pageWrapper.setAttribute("data-sidebar-hidden", "hidden");
          localStorage.setItem("sidebarOpen", false);
        }
      }
    },
    /**
     * halfmoon - light or dark theme
     */
    toggleDarkMode: function () {
      halfmoon.toggleDarkMode();
    },
    /**
     * Function to get light or dark map
     */
    toggleDarkMap: function () {
      localStorage.setItem(
        "mapTiles",
        this.currentMapMode == "light" ? "dark" : "light"
      );

      localStorage.getItem("mapTiles") &&
        (this.currentMapMode = localStorage.getItem("mapTiles"));
      this.map.removeLayer(this.currentTiles);

      this.currentTiles = L.tileLayer(
        this.mapTiles[this.currentMapMode][0],
        this.mapTiles[this.currentMapMode][1]
      ).addTo(this.map);
    },
    /**
     * Get access_token from netnamo api
     */
    updateAccessToken: async function () {
      let myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

      let urlencoded = new URLSearchParams();
      urlencoded.append("grant_type", "refresh_token");
      urlencoded.append("refresh_token", this.refreshToken);
      urlencoded.append("client_id", "5ff42c27aa535449705e170e");
      urlencoded.append(
        "client_secret",
        "LoGATpdHCIsYi2eCpk5BMqiQlRmtGQHfdAiCR9AorFFI"
      );

      let requestOptions = {
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
    /**
     * Function to get data from all stations display on the map
     */
    getStations: async function () {
      let myHeaders = new Headers();
      myHeaders.append(
        "Authorization",
        "Bearer " + localStorage.getItem("access_token")
      );

      let url = new URL("https://app.netatmo.net/api/getpublicmeasures");

      url.search = new URLSearchParams({
        limit: 1,
        divider:
          window.innerWidth > 768 ? (window.innerWidth > 970 ? 10 : 7) : 5,
        zoom: this.map.getZoom(),
        lat_ne: this.map.getBounds()._northEast.lat,
        lon_ne: this.map.getBounds()._northEast.lng,
        lat_sw: this.map.getBounds()._southWest.lat,
        lon_sw: this.map.getBounds()._southWest.lng,
        date_end: "last",
        quality: 7,
      });

      let requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      let req = await fetch(url, requestOptions);
      // if token_access expired, get a new one and recall function
      if (req.status === 403) {
        this.updateAccessToken();
        return this.getStations();
      }
      let rep = await req.json();
      await this.markers.map((marker) => this.map.removeLayer(marker)); // remove all markers
      this.markers = [];
      this.stations = rep.body;
      rep.body.map((station) => this.displayMarker(station)); // display new markers
    },
    /**
     * function to add a marker on the map
     * @param {Object} station
     */
    displayMarker: function (station) {
      let temp = Math.floor(
        station.measures[Object.keys(station.measures)[0]].res[
          Object.keys(station.measures[Object.keys(station.measures)[0]].res)[0]
        ][0]
      );
      let color = temp >= 15 ? "red" : temp <= 0 ? "" : "green";
      let icon = L.divIcon({
        className: "custom-div-icon",
        html:
          "<div class='marker-pin " +
          color +
          "'></div><span class='text-dark'>" +
          temp +
          "</span>",
        iconSize: [30, 42],
        iconAnchor: [15, 42],
      });

      let marker = L.marker(
        [station.place.location[1], station.place.location[0]],
        {
          icon: icon,
        }
      )
        .addTo(this.map)
        // add popup on marcker clic to display station's data
        .on("click", () => {
          this.stationSelected = {
            place: station.place,
            measures: {
              humidity:
                station.measures[Object.keys(station.measures)[0]].res[
                  Object.keys(
                    station.measures[Object.keys(station.measures)[0]].res
                  )[0]
                ][1],
              temp:
                station.measures[Object.keys(station.measures)[0]].res[
                  Object.keys(
                    station.measures[Object.keys(station.measures)[0]].res
                  )[0]
                ][0],
              pression:
                station.measures[Object.keys(station.measures)[1]].res[
                  Object.keys(
                    station.measures[Object.keys(station.measures)[1]].res
                  )[0]
                ][0],
            },
          };
          document.getElementById("modal-station").classList.add("show");
        });
      this.markers.push(marker);
    },
    /**
     * searching by adress function
     */
    autocomplete: async function () {
      if (this.search.trim() < 1) return;
      this.villeResult = []; // address array re init
      let url = new URL("https://nominatim.openstreetmap.org/search.php");
      url.search = new URLSearchParams({
        street: this.search.trim(),
        limit: 10,
        format: "json",
      });
      let req = await fetch(url);
      let rep = await req.json();
      await rep.map((place) => {
        this.villeResult.push({
          // add into villeResult array an object
          display_name: place.display_name,
          lat: place.lat,
          lon: place.lon,
        });
      });
    },
    /**
     * move to the address in the map and add marker
     * On mobile device, close the sideBar
     * @param {object} Ville
     */
    moveToAddress: async function (ville) {
      // Add marker at the address Selectionned (click)
      this.map.setView([ville.lat, ville.lon], 16); // move on map to the lat / lon of the selectedd city
      let icon = L.divIcon({
        className: "custom-div-icon",
        html:
          "<div class='selected-marker-pin'></div><span class='text-dark'>ici</span>",
        iconSize: [40, 42],
        iconAnchor: [15, 42],
      });
      // new marker with lat and lon data
      let marker = L.marker([ville.lat, ville.lon], { icon: icon }).addTo(
        this.map
      );
      // remove all markers of the map
      await this.selectedMarkers.map((marker) => {
        this.map.removeLayer(marker);
      });
      this.selectedMarkers = [];
      await this.selectedMarkers.push(marker); // add new marker on the map and inside the selectedMarkers array
      // Test the device

      if (window.matchMedia("only screen and (max-width: 768px)").matches) {
        // if device < 768px
        // add attribute ("data-sidebar-hidden", "hidden") to hide the sidebar
        document
          .getElementsByClassName("page-wrapper")[0]
          .setAttribute("data-sidebar-hidden", "hidden");
        localStorage.setItem("sidebarOpen", false);
      }
    },
  },
  /**
   * Function call when page init
   */
  mounted: function () {
    // get last map position from localStorage
    localStorage.getItem("centerMap") &&
      (this.centerMap = localStorage.getItem("centerMap").split(","));

    // get last map zoom from localStorage
    localStorage.getItem("zoomMap") &&
      (this.zoomMap = localStorage.getItem("zoomMap"));

    // init map
    this.map = L.map("map").setView(this.centerMap, this.zoomMap);

    // get map tiles from localStorage
    localStorage.getItem("mapTiles") &&
      (this.currentMapMode = localStorage.getItem("mapTiles"));

    this.currentTiles = L.tileLayer(
      this.mapTiles[this.currentMapMode][0],
      this.mapTiles[this.currentMapMode][1]
    ).addTo(this.map);

    document
      .getElementById("autocomplete")
      .addEventListener("keyup", debounce(this.autocomplete, 750));

    // add eventListener on the map movment
    this.map.on("moveend", () => {
      this.getStations();
      // update localStorage
      localStorage.setItem("centerMap", [
        this.map.getCenter().lat,
        this.map.getCenter().lng,
      ]);
      localStorage.setItem("zoomMap", this.map.getZoom());
    });

    // set bounds to prevent bug on world tour
    this.map.setMaxBounds(
      L.latLngBounds(
        L.latLng(-89.98155760646617, -179),
        L.latLng(89.99346179538875, 179)
      )
    );

    // remove anim on max bounds
    this.map.on("drag", () => {
      this.map.panInsideBounds(
        L.latLngBounds(
          L.latLng(-89.98155760646617, -179),
          L.latLng(89.99346179538875, 179)
        ),
        { animate: false }
      );
    });

    // try to know if sidebar was open
    localStorage.getItem("sidebarOpen") &&
      JSON.parse(localStorage.getItem("sidebarOpen")) == true &&
      document
        .getElementsByClassName("page-wrapper")[0]
        .removeAttribute("data-sidebar-hidden");

    if (!localStorage.getItem("access_token")) {
      this.updateAccessToken();
    }

    this.getStations();
  },
});
