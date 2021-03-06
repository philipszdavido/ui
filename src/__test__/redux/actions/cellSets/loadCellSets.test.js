import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import loadCellSets from '../../../../redux/actions/cellSets/loadCellSets';
import initialState from '../../../../redux/reducers/cellSets/initialState';

jest.mock('localforage');

enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('loadCellSets action', () => {
  const experimentId = '1234';

  const cellSet = {
    name: 'one', color: '#ff0000', cellIds: ['1', '2', '3'],
  };

  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Does not dispatch on normal operation', async () => {
    const store = mockStore({ cellSets: { loading: false, error: false } });
    store.dispatch(loadCellSets(experimentId, cellSet.name, cellSet.color, cellSet.cellIds));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches on loading state', async () => {
    const store = mockStore({ cellSets: { loading: true, error: false } });
    await store.dispatch(loadCellSets(experimentId));
    expect(store.getActions().length).toBeGreaterThan(0);
  });

  it('Dispatches on loading and error state', async () => {
    const store = mockStore({ cellSets: { loading: true, error: true } });
    store.dispatch(loadCellSets(experimentId));
    expect(store.getActions().length).toBeGreaterThan(0);
  });

  it('Dispatches a loading action when run after an error condition.', async () => {
    const store = mockStore({ cellSets: { loading: false, error: true } });
    store.dispatch(loadCellSets(experimentId));

    const firstAction = store.getActions()[0];

    expect(firstAction).toMatchSnapshot();
  });

  it('Dispatches a loaded action when run with the initial state.', async () => {
    const store = mockStore({ cellSets: initialState });
    store.dispatch(loadCellSets(experimentId));

    const firstAction = store.getActions()[0];

    expect(firstAction).toMatchSnapshot();
  });

  it('Dispatches an error condition if fetch fails', async () => {
    const store = mockStore({ cellSets: initialState });

    fetchMock.resetMocks();
    fetchMock.mockReject(new Error('some weird error that happened'));

    store.dispatch(loadCellSets(experimentId));

    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchSnapshot();
  });
});
