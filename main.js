var categories = ['jackets', 'shirts', 'accessories'];
var XMLParser = new DOMParser();
var badApi = new BadApi();


init();


function init() {

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
    for (i = 0; i < responseData.length; i++) {
        var item = document.createElement("div");
        item.classList.add("item");
        item.dataset.itemData = JSON.stringify(responseData[i]);
        item.innerHTML = `${responseData[i].name} ${'<br>'} ${responseData[i].manufacturer}`;
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
            modal.querySelector("#itemAvailabilityInfo").textContent = 'Error, refresh the page and try again.';
        }

    }).catch(function (error) {
        modal.querySelector("#itemAvailabilityInfo").textContent = error;
    });
}