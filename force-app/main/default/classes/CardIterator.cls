public with sharing class CardIterator implements Iterator<Object>{

    private List<Object> cards;
    private Integer currentIndex;
    
    public CardIterator(List<Object> cards){
        this.cards = cards;
        this.currentIndex = -1;
    }

    public boolean hasNext(){ 
        return currentIndex < cards.size() - 1;
    }

    public Object next(){
        if(hasNext()) {
            currentIndex++;
            return cards[currentIndex];
        } else {
            throw new NoSuchElementException();
        }
    } 
}
