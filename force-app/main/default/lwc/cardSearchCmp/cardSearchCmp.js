import { LightningElement } from 'lwc';
import doSearch from '@salesforce/apex/CardSearchController.doScryfallSearch';
import saveFile from '@salesforce/apex/CardSearchController.saveFile';
import getFile from '@salesforce/apex/CardSearchController.getFile';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class CardSearchCmp extends LightningElement {

    textValue;
    searchResults;
    showResults = false;
    showModal = false;
    selectedCard;
    nonFoilAmount = 0;
    foilAmount = 0;
    savedCards = [];
    showSpinner = false;
    location = 'Lands Binder';

    get locations() {
        return [
            { label: 'Lands Binder', value: 'Lands Binder' },
            { label: 'Main Binder', value: 'Main Binder' },
            { label: 'Good Binder', value: 'Good Binder' },
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
            { label: 'Ping', value: 'Ping' },
            { label: 'Asmoranomardicadaistinaculdacar', value: 'Asmoranomardicadaistinaculdacar' },
        ];
    }

    connectedCallback() {
        this.showSpinner = true;
        getFile()
            .then(result => {
                console.log(result);
                this.savedCards = JSON.parse(result);
                this.showSpinner = false;
            })
            .catch(error => {
                this.showToast(error);
                console.log(error);
            });
    }

    selectLocation(event) {
        this.location = event.detail.value;
    }

    handleClick() {
        this.showSpinner = true;
        console.log(this.textValue);
        doSearch({ searchString: this.textValue })
            .then(result => {
                console.log(result);
                this.searchResults = JSON.parse(result);
                this.showResults = true;
                this.showSpinner = false;
            })
            .catch(error => {
                this.showToast(error);
                console.log(error);
            });
    }

    handleInputChange(event) {
        this.textValue = event.detail.value;
        this.showResults = false;
    }

    cardSelected(event) {
        console.log(event.currentTarget.getAttribute('data-id'));
        this.selectedCard = this.searchResults.data.find(element => event.currentTarget.getAttribute('data-id') == element.id);
        let i = this.existingCard(this.selectedCard.id + this.location);
        if (i != null) {
            this.nonFoilAmount = this.savedCards[i].nonFoilAmount;
            this.foilAmount = this.savedCards[i].foilAmount;
        }
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.nonFoilAmount = 0;
        this.foilAmount = 0;
    }

    addCard() {
        this.nonFoilAmount = this.nonFoilAmount ? this.nonFoilAmount + 1 : 1;
    }

    addFoilCard() {
        this.foilAmount = this.foilAmount ? this.foilAmount + 1 : 1;
    }

    subtractCard() {
        this.nonFoilAmount = this.nonFoilAmount ? this.nonFoilAmount - 1 : 0;
    }

    subtractFoilCard() {
        this.foilAmount = this.foilAmount ? this.foilAmount - 1 : 0;
    }

    save() {
        let i = this.existingCard(this.selectedCard.id + this.location);
        if (i != null) {
            this.savedCards[i].nonFoilAmount = this.nonFoilAmount;
            this.savedCards[i].foilAmount = this.foilAmount;
            if((this.nonFoilAmount + this.foilAmount) == 0){
                this.savedCards.splice(i, 1);
            }
        } else {
            this.savedCards.push({
                uniqueid: this.selectedCard.id + this.location,
                id: this.selectedCard.id,
                foilAmount: this.foilAmount,
                nonFoilAmount: this.nonFoilAmount,
                location: this.location
            });
        }
        console.log(JSON.stringify(this.savedCards));
        this.closeModal();
    }

    existingCard(id) {
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

    showToast(message) {
        const evt = new ShowToastEvent({
            title: 'Error',
            message: message,
            variant: 'error',
        });
        this.dispatchEvent(evt);
        this.showSpinner = false;
    }
}