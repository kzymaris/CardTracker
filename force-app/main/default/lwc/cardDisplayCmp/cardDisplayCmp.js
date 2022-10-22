import { LightningElement } from 'lwc';
import getBigFile from '@salesforce/apex/CardSearchController.getBigFile';
import getBigFile2 from '@salesforce/apex/CardSearchController.getBigFile2';
import getFile from '@salesforce/apex/CardSearchController.getFile';
import saveFile from '@salesforce/apex/CardSearchController.saveFile';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import mana from '@salesforce/resourceUrl/Mana';

export default class CardDisplayCmp extends LightningElement {

    showSpinner = false;
    showModal = false;
    savedCards;
    scryfallData;
    location = 'Lands Binder';
    sum;
    count;
    uniqueCount;
    filteredCards = [];
    showCards = false;
    searchTerm;
    ascending;
    price;
    selectedCard;
    locationChanges = new Map();

    colors = {
        B: false,
        R: false,
        G: false,
        B: false,
        W: false
    };

    black = mana + '/Mana/manab.png';
    blue = mana + '/Mana/manau.png';
    red = mana + '/Mana/manar.png';
    white = mana + '/Mana/manaw.png';
    green = mana + '/Mana/manag.png';

    _locations = [
        { label: 'Lands Binder', value: 'Lands Binder' },
        { label: 'Main Binder', value: 'Main Binder' },
        { label: 'Nonrares', value: 'Nonrares' },
        { label: 'Sram', value: 'Sram' },
        { label: 'Sidisi', value: 'Sidisi' },
        { label: 'Gishath', value: 'Gishath' },
        { label: 'Chainer', value: 'Chainer' },
        { label: 'Sythis', value: 'Sythis' },
        { label: 'Etali', value: 'Etali' },
        { label: 'Gitrog', value: 'Gitrog' },
        { label: 'Clones', value: 'Clones' },
        { label: 'Vaevictis', value: 'Vaevictis' },
        { label: 'Marchesa', value: 'Marchesa' },
    ];
    get locations() {
        let result = [...this._locations];
        result.push({ label: 'All', value: 'All' });
        return result;
    }

    connectedCallback() {
        console.log('0');

        this.showSpinner = true;
        getBigFile()
            .then(result => {
                console.log('1');
                this.scryfallData = JSON.parse(atob(result));
                getBigFile2()
                    .then(result => {
                        console.log('2');
                        this.scryfallData.push(...JSON.parse(atob(result)));
                        getFile()
                            .then(result => {
                                console.log('3');
                                this.savedCards = JSON.parse(result);
                                this.filterCards();
                                this.showSpinner = false;
                            })
                            .catch(error => {
                                this.showToast(error);
                                console.log(error);
                            });
                    })
                    .catch(error => {
                        this.showToast(error);
                        console.log(error);
                    });
            })
            .catch(error => {
                this.showToast(error);
                console.log(error);
            });
    }

    handleInputChange(event) {
        this.searchTerm = event.detail.value;
    }

    selectedColors() {
        let colors = [];
        ['R', 'B', 'U', 'G', 'W'].forEach(color => {
            if (this.colors[color]) {
                colors.push(color);
            }
        }, this);
        return colors;
    }

    compare(array1, array2) {
        let match = true;
        array2.forEach(selColor => {
            let temp = false;
            if (array1 && array1.length > 0) {
                array1.forEach(color => {
                    if (selColor == color) {
                        temp = true;
                    }
                });
            }

            if (!temp) {
                match = false;
            }
        });
        return match;
    }

    filterCards() {
        let sum = 0;
        let count = 0;
        this.filteredCards = [];
        this.showCards = false;
        let colorsSelected = this.selectedColors();
        this.savedCards.forEach(element => {
            if (this.location == 'All' || this.location == element.location) {
                let cardMatch = this.scryfallData.find(card => {
                    let nameFilter = (!this.searchTerm || card.name.toLowerCase().includes(this.searchTerm));
                    let price = element.foilAmount ? card.prices.usd_foil : card.prices.usd;
                    let priceFilter = (!this.price || parseFloat(price) > parseFloat(this.price));
                    let colorFilter = ((colorsSelected.length == 0) || this.compare(card.colors, colorsSelected));
                    return (card.id == element.id && nameFilter && priceFilter && colorFilter);
                }, this);
                if (cardMatch) {
                    cardMatch = JSON.parse(JSON.stringify(cardMatch));

                    cardMatch.nonFoilAmount = element.nonFoilAmount ? element.nonFoilAmount : 0;
                    count += cardMatch.nonFoilAmount;
                    sum += (cardMatch.nonFoilAmount * cardMatch.prices.usd);

                    cardMatch.foilAmount = element.foilAmount ? element.foilAmount : 0;
                    count += cardMatch.foilAmount;
                    sum += (cardMatch.foilAmount * cardMatch.prices.usd_foil);

                    cardMatch.locations = [];
                    if (cardMatch.foilAmount > 0) {
                        for (let i = 0; i < cardMatch.foilAmount; i++) {
                            cardMatch.locations.push({ location: element.location, index: i, foil: true, id: i + "true" + element.location });
                        }
                    }
                    if (cardMatch.nonFoilAmount > 0) {
                        for (let i = 0; i < cardMatch.nonFoilAmount; i++) {
                            cardMatch.locations.push({ location: element.location, index: i, foil: false, id: i + "false" + element.location });
                        }
                    }
                    this.filteredCards.push(cardMatch);
                }

            }

        }, this);
        //roll up duplicates so that they appear as a single card
        let ids = [];
        this.filteredCards.forEach(card => ids.push(card.id));
        ids = [...new Set(ids)];
        let temp = [];
        ids.forEach(id => {
            let matches = this.filteredCards.filter((card, index) => {
                return id == card.id;
            }, this);
            let card;
            matches.forEach(match => {
                if (!card) {
                    card = match;
                } else {
                    card.foilAmount += match.foilAmount;
                    card.nonFoilAmount += match.nonFoilAmount;
                    card.locations.push(...match.locations);
                }
            }, this);
            if (card) {
                temp.push(card);
            }
        }, this);
        this.filteredCards = temp.sort((first, second) => {
            if (first.name < second.name) {
                return -1;
            }
            if (first.name > second.name) {
                return 1;
            }
            return 0;
        });

        this.sum = 'Total Price: $' + sum.toFixed(2);
        this.uniqueCount = 'Unique Cards: ' + this.filteredCards.length;
        this.count = 'Card Count: ' + count;
        this.showCards = true;
    }

    showToast(message) {
        const evt = new ShowToastEvent({
            title: 'Error',
            message: JSON.stringify(message),
            variant: 'error',
        });
        this.dispatchEvent(evt);
        this.showSpinner = false;
    }

    selectLocation(event) {
        this.location = event.detail.value;
    }

    sortName() {
        this.showCards = false;
        this.filteredCards = this.filteredCards.sort((first, second) => {
            if (first.name < second.name) {
                return this.ascending ? -1 : 1;
            }
            if (first.name > second.name) {
                return this.ascending ? 1 : -1;
            }
            return 0;
        });
        this.ascending = !this.ascending;
        this.showCards = true;
    }

    sortPrice() {
        this.showCards = false;
        this.filteredCards = this.filteredCards.sort((first, second) => {
            let price1 = first.foilAmount ? first.prices.usd_foil : first.prices.usd;
            let price2 = second.foilAmount ? second.prices.usd_foil : second.prices.usd;
            return this.ascending ? price1 - price2 : price2 - price1;
        });
        this.ascending = !this.ascending;
        this.showCards = true;
    }

    handlePriceChange(event) {
        this.price = event.detail.value;
    }

    manaClicked(event) {
        console.log(event.currentTarget);
        this.colors[event.currentTarget.getAttribute('data-color')] = !this.colors[event.currentTarget.getAttribute('data-color')];
        console.log(this.colors);
        event.currentTarget.className = event.currentTarget.className == 'mana slds-m-left_x-small' ? 'selected slds-m-left_x-small' : 'mana slds-m-left_x-small';
    }

    cardSelected(event) {
        console.log(event.currentTarget.getAttribute('data-id'));
        this.selectedCard = this.filteredCards.find(element => event.currentTarget.getAttribute('data-id') == element.id);
        console.log(this.savedCards.filter(element => event.currentTarget.getAttribute('data-id') == element.id));
        console.log(this.selectedCard.locations);
        this.showModal = true;
    }

    closeModal() {
        this.locationChanges = new Map();
        this.showModal = false;
    }

    reParent(event) {
        console.log(event.detail.value);
        console.log(event.currentTarget.name);

        this.locationChanges.set(event.currentTarget.name, event.detail.value);
        console.log(this.locationChanges);


    }

    getIndex(id) {
        let result = null;
        if (this.savedCards.length > 0) {
            this.savedCards.forEach((element, index) => {
                if (element.uniqueid == id) {
                    result = index;
                }
            }, this);
        }
        return result;
    }

    save() {

        this.locationChanges.forEach((value, key) => {
            let instance = this.selectedCard.locations.find(element => element.id == key);
            let cardId = this.selectedCard.id + instance.location;
            let cardIndex = this.getIndex(cardId);
            if (this.savedCards[cardIndex].location != value) {
                let newId = this.selectedCard.id + value;
                let existingCardIndex = this.getIndex(newId);
                if (existingCardIndex != null) {
                    if (instance.foil) {
                        this.savedCards[existingCardIndex].foilAmount++;
                    } else {
                        this.savedCards[existingCardIndex].nonFoilAmount++;
                    }
                } else {
                    let foilAmount = instance.foil ? 1 : 0;
                    let nonFoilAmount = instance.foil ? 0 : 1;
                    this.savedCards.push({
                        uniqueid: newId,
                        id: this.selectedCard.id,
                        foilAmount: foilAmount,
                        nonFoilAmount: nonFoilAmount,
                        location: value
                    });
                }
                if (instance.foil) {
                    this.savedCards[cardIndex].foilAmount--;
                } else {
                    this.savedCards[cardIndex].nonFoilAmount--;
                }
                if (this.savedCards[cardIndex].nonFoilAmount + this.savedCards[cardIndex].foilAmount == 0) {
                    this.savedCards.splice(cardIndex, 1);
                } else if (this.savedCards[cardIndex].nonFoilAmount + this.savedCards[cardIndex].foilAmount < 0) {
                    this.showToast("This should not happen");
                }

            }
        }, this);

        console.log(this.savedCards.filter(card => card.id == this.selectedCard.id));

        this.filterCards();
        this.closeModal();
    }

    saveToFile() {
        this.showSpinner = true;
        saveFile({ jsonString: JSON.stringify(this.savedCards) })
            .then(result => {
                const evt = new ShowToastEvent({
                    title: 'Success',
                    message: 'File Saved',
                    variant: 'success',
                });
                this.dispatchEvent(evt);
                console.log('File Saved');
                this.showSpinner = false;
            })
            .catch(error => {
                this.showToast(error);
                console.log(error);
            });
    }
}