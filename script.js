var categories = ['jackets', 'shirts', 'accessories'];
var XMLParser = new DOMParser();
import BadApi from 'api.js';
var badApi;

class BadApi {
    constructor() {
        this.endpoint = 'https://bad-api-assignment.reaktor.com';
        this.cacheTime = 300000;
        this.cache = {};
    }

    async getItemList(category) {
        const itemList = await this.getRequestData(this.endpoint + '/products/' + category);
        return itemList;
    }

    async getAvailability(manufacturer) {
        const availabilityInfo = await this.getRequestData(this.endpoint + '/availability/' + manufacturer);
        return availabilityInfo;
    }

    async getRequestData(url) {
        const self = this;

        if (self.cache[url] && !self.cacheExpired(self.cache[url])) {
            return self.cache[url];
        }

        const response = await self.fetchRetry(url, [], 2);
        const responseData = await response.json();
        self.cache[url] = responseData;
        self.cache[url].cacheTimestamp = Date.now();
        return self.cache[url];
    }

    async fetchRetry(url, options, attempt) {
        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error("Unable to retrieve data from " + url);
            }
            return response;

        } catch (error) {
            if (attempt <= 1) {
                throw error;
            }
            await this.sleep(1000);
            return this.fetchRetry(url, options, attempt - 1);
        }
    }

    cacheExpired(cacheItem) {
        if (cacheItem.cacheTimestamp && cacheItem.cacheTimestamp + this.cacheTime > Date.now()) {
            return false;
        }
        return true;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

}

init();


function init() {

    badApi = new BadApi();

    for (var i = 0; i < categories.length; i++) {
        var option = document.createElement("option");
        option.value = categories[i];
        option.text = categories[i];
        document.getElementById('categorySelector').appendChild(option);
    }

    document.addEventListener('input', function (event) {
        if (event.target.id == 'categorySelector') {
            getItems(event.target.value);
        }
    }, false);

    window.onclick = function (event) {
        if (event.target == document.getElementById('modalItem') || event.target == document.getElementById('modalX')) {
            document.getElementById('modalItem').style.display = "none";
        }
    }

}

async function getItems(category) {
    const responseData = await badApi.getItemList(category);
    document.getElementById('itemList').innerHTML = '';
    for (i = 0; i < document.getElementById('itemsPerPage').value && i < responseData.length; i++) {
        var item = document.createElement("div");
        item.classList.add("item");
        item.dataset.itemData = JSON.stringify(responseData[i]);
        item.innerHTML = "<p>" + responseData[i].name + "<br>" + responseData[i].manufacturer + "</p>";
        item.onclick = function (event) {
            showItem(event.currentTarget);
        };
        document.getElementById('itemList').appendChild(item);

    }
}

async function showItem(item) {
    const itemData = JSON.parse(item.dataset.itemData);
    const response = badApi.getAvailability(itemData.manufacturer);
    const modal = document.getElementById('modalItem');
    modal.style.display = "block";
    const modalItemData = modal.querySelector("#itemData");
    modalItemData.innerHTML = '';
    for (const [key, value] of Object.entries(itemData)) {
        modalItemData.innerHTML += (`${key}: ${value} ${'<br>'}`);
    }
    modal.querySelector("#itemAvailabilityInfo").textContent = "LOADING...";
    response.then(function (responseData) {
        try {
            const itemAvailabilityXML = responseData.response.find(el => el.id = itemData.id.toUpperCase());
            const itemAvailability = XMLParser.parseFromString(itemAvailabilityXML.DATAPAYLOAD, "text/xml").getElementsByTagName("INSTOCKVALUE")[0].childNodes[0].nodeValue;
            modal.querySelector("#itemAvailabilityInfo").textContent = itemAvailability;
        } catch (error) {
            modal.querySelector("#itemAvailabilityInfo").textContent = 'Error, reload page and try again.';
        }

    }).catch(function (error) {
        modal.querySelector("#itemAvailabilityInfo").textContent = error;
    });
}