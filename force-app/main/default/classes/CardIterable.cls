public with sharing class CardIterable implements Iterable<Object>{
    public Iterator<Object> iterator(){
        List<Object> m = (List<Object>)JSON.deserializeUntyped(CardSearchController.getFile());
        return new CardIterator(m);
     }
}
