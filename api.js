var gResponse;
var gResponseData;
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
        const url = this.endpoint + '/availability/' + manufacturer;
        let availabilityInfo = await this.getRequestData(url);

        let retryCount = 0;
        while (typeof (availabilityInfo.response) == 'string' && retryCount < 2) {
            this.deleteCacheItem(url);
            this.sleep(500);
            availabilityInfo = await this.getRequestData(url);
            retryCount++;
        }

        if (typeof (availabilityInfo.response) == 'string') throw 'API error - refresh the page and try again.'

        return availabilityInfo.response;
    }

    deleteCacheItem(key) {
        delete this.cache[key];
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