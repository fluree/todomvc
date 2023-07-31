import { useCallback } from "react";
import axios from 'axios';

const defaultLedgerName = "todomvc";
const flureePort = 58090;
const flureeUrl = `http://localhost:${flureePort}/fluree`;

export const useFluree = (ledgerName = defaultLedgerName) => {
  const createJSONLD = useCallback((dataArray) => {
    return {
      "ledger": ledgerName,
      "txn": {
        "@graph": dataArray
      }
    }
  }, [ledgerName])

  const createLedger = useCallback(
    async (dataArray) => {
      if (!dataArray) {
        dataArray = [{
          "message": "creating new ledger"
        }];
      }
      else {
        dataArray = dataArray.map((d, i) => {
          return {
            "@id": d["id"] || d["@id"],
            "@type": ["schema:ListItem"],
            "content": d["content"],
            checked: d["checked"].toString(),
            editMode: d["editMode"].toString()
          }
        })
      }
      const transaction = {
        "ledger": ledgerName,
        "txn": dataArray,
        "defaultContext": {
          "schema": "http://schema.org/",
          "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
          "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
          "wiki": "https://www.wikidata.org/wiki/",
          "skos": "http://www.w3.org/2008/05/skos#",
          "f": "https://ns.flur.ee/ledger#",
          "ex": "http://example.org/"
        }
      }
      axios.post(`${flureeUrl}/create`, transaction)
        .catch(ex => {
          console.error("Error in createLedger", ex);
        })
    }, [ledgerName]
  )

  const transact = useCallback(
    async (dataArray) => {
      if (dataArray) {
        dataArray = dataArray.map((d, i) => {
          return {
            "@id": d["@id"],
            "@type": ["schema:ListItem"],
            "content": d["content"],
            checked: d["checked"].toString(),
            editMode: d["editMode"].toString()
          }
        })
        const transaction = createJSONLD(dataArray);
        return axios.post(`${flureeUrl}/transact`, transaction)
          .then()
          .catch(ex => {
            console.error("Error in Fluree transaction", ex)
            // TODO: check if that was the error before attempting to create ledger
            createLedger(dataArray);
          });
      }
    }, [createLedger, createJSONLD]
  )

  const remove = useCallback(
    async (dataArray) => {
      console.error("remove")
      if (dataArray) {
        const transaction = {
          "ledger": ledgerName,
          "txn": {
            "delete": ["?s", "?p", "?o"],
            "where": [["?s", "?p", "?o"]],
            "values": ["?s", dataArray.map((item) => {
              return item[2]
            })],
          }
        }
        return axios.post(`${flureeUrl}/transact`, transaction)
          .catch(ex => console.error("Error in Fluree delete", ex));
      }
    }, [ledgerName]
  ) 

  const query = useCallback(
    async (queryJson) => {
      const transaction = {
        "ledger": ledgerName,
        "query": queryJson,
      }
      return axios.post(`${flureeUrl}/query`, transaction)
        .then(r => {
          return r;
        })
        .catch(ex => console.warn("Error in Fluree query", ex))
    }, [ledgerName]
  )

  return {
    createLedger,
    remove,
    query,
    transact,
  };
};
