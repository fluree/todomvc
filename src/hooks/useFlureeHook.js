import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const ledgerName = 'todomvc';
const flureePort = 58090;
const flureeUrl = `http://localhost:${flureePort}/fluree`;

const useFlureeHook = (initialValue) => {
  const [storedValue, setStoredValue] = useState(initialValue);

  useEffect(() => {
    const getData = async () => {
      const list = await flureeQuery();
      setStoredValue(list);
    };

    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createJSONLD = useCallback((dataArray) => {
    return {
      ledger: ledgerName,
      txn: {
        '@graph': dataArray,
      },
    };
  }, []);

  const createLedger = useCallback(async (dataArray) => {
    if (!dataArray) {
      dataArray = [
        {
          message: 'creating new ledger',
        },
      ];
    } else {
      dataArray = dataArray.map((d, i) => {
        return {
          '@id': d['@id'],
          '@type': ['schema:ListItem'],
          content: d.content,
          checked: d.checked.toString(),
          editMode: d.editMode.toString(),
          // checked: d.checked,
          // editMode: d.editMode
        };
      });
    }
    const transaction = {
      ledger: ledgerName,
      txn: dataArray,
      defaultContext: {
        schema: 'http://schema.org/',
      },
    };
    axios.post(`${flureeUrl}/create`, transaction).catch((ex) => {
      console.error('Error in createLedger', ex);
    });
  }, []);

  const transact = useCallback(
    async (dataArray) => {
      if (dataArray) {
        dataArray = dataArray.map((d) => {
          return {
            '@id': d['@id'],
            '@type': ['schema:ListItem'],
            content: d.content,
            checked: d['checked'].toString(),
            editMode: d['editMode'].toString(),
            // checked: d.checked,
            // editMode: d.editMode
          };
        });
        const transaction = createJSONLD(dataArray);
        return axios
          .post(`${flureeUrl}/transact`, transaction)
          .then()
          .catch((ex) => {
            if (ex?.response?.data?.message?.includes('No commit exists')) {
              createLedger(dataArray);
            } else {
              console.error('Error in Fluree transaction', ex);
            }
          });
      }
    },
    [createLedger, createJSONLD]
  );

  const remove = useCallback(async (dataArray) => {
    if (dataArray) {
      const transaction = {
        ledger: ledgerName,
        txn: {
          delete: ['?s', '?p', '?o'],
          where: [['?s', '?p', '?o']],
          values: ['?s', dataArray],
        },
      };
      return axios
        .post(`${flureeUrl}/transact`, transaction)
        .catch((ex) => console.error('Error in Fluree delete', ex));
    }
  }, []);

  const query = useCallback(
    async (queryJson) => {
      const transaction = {
        ledger: ledgerName,
        query: queryJson,
      };
      return axios
        .post(`${flureeUrl}/query`, transaction)
        .then((r) => {
          return r;
        })
        .catch((ex) => {
          if (ex?.response?.data?.message?.includes('No commit exists')) {
            createLedger();
          } else {
            console.error('Error in Fluree query', ex?.response);
          }
        });
    },
    [createLedger]
  );

  const flureeQuery = async () => {
    let list = initialValue;
    try {
      list = await query({
        where: [['?s', 'rdf:type', 'schema:ListItem']],
        select: {
          '?s': ['*'],
        },
      })
        .then((r) => {
          if (r) {
            return r.data;
          } else {
            return initialValue;
          }
        })
        .catch((ex) => {
          // If error, return initialValue
          console.error('Error retrieving initial data from Fluree:', ex);
          return initialValue;
        });
    } catch (ex) {
      // If error, return initialValue
      console.error('Error retrieving initial data from Fluree:', ex);
      return initialValue;
    }
    list = list.map((l) => {
      return { ...l, editMode: false, checked: l.checked === 'true' };
    });
    return list;
  };

  const setValue = async (value) => {
    const deleteItems = storedValue.filter(
      (v) => !value.some((x) => x['@id'] === v['@id'])
    );
    try {
      if (deleteItems?.length) {
        const itemsToRemove = deleteItems.map((d) => d['@id']);
        remove(itemsToRemove);
      } else {
        transact(value);
      }
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);
    } catch (ex) {
      console.error('Error saving data to Fluree:', ex);
    }
  };

  return [storedValue, setValue];
};

export default useFlureeHook;
