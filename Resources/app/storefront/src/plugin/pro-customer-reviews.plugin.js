import Plugin from 'src/plugin-system/plugin.class.js';
import { boostrapGoogleMaps } from '../lib/maps/index.js';

export class ProCustomerReviews extends Plugin {
    static get options() {
        return {
            key: '',
            id: '',
            loadLib: false,
        };
    }

    /**
     * @param  {string} selector
     * @param  {string} type
     * @param  {string} name
     * @param  {Function} value
     * @return {Function}
     */
    createBinding(selector, type, name, value) {
        const target = (selector === 'self') ? this.el : this.el.querySelector(selector);

        if (type === 'content') {
            return () => {
                target.textContent = value();
            };
        }

        if (type === 'repeat') {
            const host = target.parentNode;

            return () => {
                const targets = this.el.querySelectorAll(selector);
                let targetCount = targets.length;
                const count = value();

                if (targetCount === value) {
                    return;
                }

                while (targetCount > count) {
                    host.removeChild(targets[targetCount - 1]);
                    targetCount -= 1;
                }

                while (targetCount < count) {
                    host.appendChild(target.cloneNode(true));
                    targetCount += 1;
                }
            };
        }

        if (type === 'if') {
            return () => {
                if (!value()) {
                    target.setAttribute('hidden', '');

                    return;
                }

                target.removeAttribute('hidden');
            };
        }

        if (type === 'attribute') {
            return () => {
                const currentValue = value();

                if (name in target) {
                    target[name] = currentValue;

                    return;
                }

                target.setAttribute(name, currentValue);
            };
        }

        throw new TypeError(`unkown binding type ${type}`);
    }

    initConfig() {
        for (const option in this.options) {
            if (!this.el.dataset[option]) {
                continue;
            }

            if (['true', 'false'].includes(this.el.dataset[option])) {
                this.options[option] = this.el.dataset[option] === '1';

                continue;
            }

            this.options[option] = this.el.dataset[option];
        }
    }

    initBindings() {
        this.bindings = [
            this.createBinding('.rating .current', 'content', null, () => this.currentRating.toFixed(1)),
            this.createBinding('.rating .stars .full-star', 'repeat', null, () => {
                const fraction = this.getFraction(this.currentRating);

                if (fraction >= 0.8) {
                    return Math.ceil(this.currentRating);
                }

                return Math.floor(this.currentRating);
            }),
            this.createBinding('.rating .stars .half-star', 'if', null, () => this.getFraction(this.currentRating) >= 0.3 && this.getFraction(this.currentRating) < 0.8),
            this.createBinding('.rating .stars .empty-star', 'repeat', null, () => {
                return 5 - (this.getFraction(this.currentRating) >= 0.3 ? Math.ceil(this.currentRating) : Math.floor(this.currentRating));
            }),
            this.createBinding('.rating', 'attribute', 'aria-valuenow', () => this.currentRating.toFixed(1)),
            this.createBinding('self', 'attribute', 'href', () => this.placeUrl),
        ];

        this.updateBindings();
    }

    initMaps() {
        if (this.options.loadLib) {
            return boostrapGoogleMaps(this.options.key);
        }

        if (!window.google || !window.google.maps) {
            return Promise.reject(new Error('Google Maps API Library is not available!'));
        }

        return Promise.resolve(window.google.maps);
    }

    init() {
        this.bindings = [];
        this.currentRating = 0;
        this.placeUrl = '';
        this.options = Object.create(this.constructor.options);
        this.initConfig();
        this.initBindings();
        this.loadPlace();
    }

    loadPlace() {
        this.initMaps()
            .then(GoogleMaps => {
                const placeService = new GoogleMaps.places.PlacesService(document.createElement('div'));

                placeService.getDetails({ placeId: this.options.id, fields: ['rating', 'url'] }, (place) => {
                    this.currentRating = place.rating;
                    this.placeUrl = place.url;

                    this.updateBindings();
                });
            });
    }

    updateBindings() {
        this.bindings.forEach((binding) => binding());
    }

    updateRating(rating) {
        this.currentRating = rating;
        this.updateBindings();
    }

    getFraction(number) {
        return number % 1 + Number.EPSILON;
    }
}
