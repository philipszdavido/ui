import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import createCellSet from '../../../../redux/actions/cellSets/createCellSet';
import initialState from '../../../../redux/reducers/cellSetsReducer/initialState';
import { CELL_SETS_CREATE, CELL_SETS_SAVE } from '../../../../redux/actionTypes/cellSets';

jest.mock('localforage');

enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('createCellSet action', () => {
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

  it('Does not dispatch on loading state', async () => {
    const store = mockStore({ cellSets: { loading: true, error: false } });
    await store.dispatch(createCellSet(experimentId, cellSet.name, cellSet.color, cellSet.cellIds));
    expect(store.getActions().length).toEqual(0);
  });

  it('Does not dispatch on error state', async () => {
    const store = mockStore({ cellSets: { loading: false, error: true } });
    await store.dispatch(createCellSet(experimentId, cellSet.name, cellSet.color, cellSet.cellIds));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches an action to create cell set to the reducer', async () => {
    const store = mockStore({ cellSets: { ...initialState, loading: false } });
    await store.dispatch(createCellSet(experimentId, cellSet.name, cellSet.color, cellSet.cellIds));

    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchObject(
      { type: CELL_SETS_CREATE, payload: { ...cellSet, experimentId } },
    );
  });

  it('Last action dispatches cellSetSave event', async () => {
    const store = mockStore({ cellSets: { ...initialState, loading: false } });
    await store.dispatch(createCellSet(experimentId, cellSet.name, cellSet.color, cellSet.cellIds));

    const lastActionID = store.getActions().length - 1;
    const lastAction = store.getActions()[lastActionID];

    expect(lastAction).toMatchObject({ type: CELL_SETS_SAVE, payload: { experimentId } });
  });
});