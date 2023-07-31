import { useEffect, useState } from 'react';
import { useFluree } from './useFluree';

const useFlureeHook = (initialValue) => {
  const { remove, query, transact } = useFluree();
  const [storedValue, setStoredValue] = useState(initialValue);

  useEffect(() => {
    const getData = async () => {
      const list = await flureeQuery();
      setStoredValue(list);
    }
    
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const flureeQuery = async () => {
    let list = initialValue;
    try {
      list = await query({
        "where": [
          [
            "?i",
            "rdf:type",
            "schema:ListItem"
          ]
        ],
        "select": {
          "?i": [
            "*"
          ]
        }
      }).then(r => {
        return r.data;
      }).catch(ex => {
        console.error("Error retrieving initial data from Fluree:", ex)
        return initialValue;
      })
    } catch (ex) {
      // If error also return initialValue
      console.error("Error retrieving initial data from Fluree:", ex)
      return initialValue;
    }
    list = list.map(l => {
      return {...l, checked: false, editMode: false}
    });
    return list;
  }
  
  const setValue = async (value) => {
    const deleteItems = storedValue.filter((v) => !value.some((x) => x["@id"] === v["@id"]));
    try {
      if (deleteItems && deleteItems.length) {
        const itemsToRemove = deleteItems.map(d => ["?s", "@id", d["@id"]])
        remove(itemsToRemove);
      }
      else {
        transact(value);
      }
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);
    } catch (ex) {
      console.error("Error saving data to Fluree:", ex);
    }
  };
  
  return [storedValue, setValue];
}

export default useFlureeHook;