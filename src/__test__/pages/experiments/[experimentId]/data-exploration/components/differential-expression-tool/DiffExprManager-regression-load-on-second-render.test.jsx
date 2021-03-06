import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import preloadAll from 'jest-next-dynamic';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import waitForActions from 'redux-mock-store-await-actions';
import DiffExprManager from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/differential-expression-tool/DiffExprManager';
import DiffExprCompute from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/differential-expression-tool/DiffExprCompute';
import DiffExprResults from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/differential-expression-tool/DiffExprResults';
import initialState from '../../../../../../../redux/reducers/differentialExpression/initialState';

import { DIFF_EXPR_LOADING, DIFF_EXPR_LOADED } from '../../../../../../../redux/actionTypes/differentialExpression';

jest.mock('localforage');

// ensure isBrowser is `true`
jest.mock('../../../../../../../utils/environment', () => true);

jest.mock('../../../../../../../utils/sendWork', () => ({
  __esModule: true, // this property makes it work
  default: jest.fn(() => new Promise((resolve) => resolve({
    results: [
      {
        body: JSON.stringify({
          rows: [
            {
              pval: 1.4969461240347763e-12, qval: 1.647289002209057e-11, log2fc: -1.4274754343649423, gene_names: 'A',
            },
            {
              pval: 2.4969461240347763e-12, qval: 2.647289002209057e-11, log2fc: -2.4274754343649423, gene_names: 'B',
            },
            {
              pval: 3.4969461240347763e-12, qval: 3.647289002209057e-11, log2fc: -3.4274754343649423, gene_names: 'C',
            },
            {
              pval: 4.4969461240347763e-12, qval: 4.647289002209057e-11, log2fc: -4.4274754343649423, gene_names: 'D',
            },
            {
              pval: 5.4969461240347763e-12, qval: 5.647289002209057e-11, log2fc: -5.4274754343649423, gene_names: 'E',
            },
          ],
          total: 500,
        }),
      },
    ],
  }))),
}));

const mockStore = configureMockStore([thunk]);

const storeState = {
  differentialExpression: { ...initialState },
  cellSets: {
    hierarchy: [],
    properties: {},
  },
  genes: {
    focused: undefined,
  },
};

let store = null;

describe('DiffExprManager regression test -- diff exp would not reload after `go back` was hit and a new cluster selected', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(() => {
    store = mockStore(storeState);

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        document: '',
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  configure({ adapter: new Adapter() });

  it('on click of compute with changed parameters, DiffExprManager calls the results view and dispatches the appropriate actions', async () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprManager experimentId='1234' view='compute' width={100} height={200} />
      </Provider>,
    );

    const cellSets = { cellSet: 'cluster-1', compareWith: 'rest' };
    act(() => {
      component.find(DiffExprCompute).props().onCompute(cellSets);
    });
    component.update();

    expect(component.find(DiffExprResults).length).toEqual(1);
    expect(component.find(DiffExprCompute).length).toEqual(0);

    await waitForActions(store, [DIFF_EXPR_LOADING, DIFF_EXPR_LOADED]);

    expect(store.getActions().length).toEqual(2);
    expect(store.getActions()[0]).toMatchSnapshot();
    expect(store.getActions()[1]).toMatchSnapshot();
  });

  it('if we then go back and change the parameters again, the new differential expression data should be loading', async () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprManager experimentId='1234' view='compute' width={100} height={200} />
      </Provider>,
    );

    // Choose a cluster and hit compute.
    let cellSets = { cellSet: 'cluster-2', compareWith: 'rest' };
    act(() => {
      component.find(DiffExprCompute).props().onCompute(cellSets);
    });
    component.update();

    expect(component.find(DiffExprResults).length).toEqual(1);
    expect(component.find(DiffExprCompute).length).toEqual(0);

    // Ensure load diff exp was called.
    await waitForActions(store, [DIFF_EXPR_LOADING, DIFF_EXPR_LOADED]);

    expect(store.getActions().length).toEqual(2);
    expect(store.getActions()[0]).toMatchSnapshot();
    expect(store.getActions()[1]).toMatchSnapshot();

    // Go back.
    act(() => {
      component.find(DiffExprResults).props().onGoBack();
    });
    component.update();

    // Ensure original is still rendered correctly.
    expect(component.find(DiffExprResults).length).toEqual(0);
    expect(component.find(DiffExprCompute).length).toEqual(1);

    // Choose another cell set.
    cellSets = { cellSet: 'cluster-3', compareWith: 'rest' };
    act(() => {
      component.find(DiffExprCompute).props().onCompute(cellSets);
    });
    component.update();

    // Ensure load diff exp was called again.
    await waitForActions(store, [DIFF_EXPR_LOADING, DIFF_EXPR_LOADED]);

    expect(store.getActions().length).toEqual(4);
    expect(store.getActions()[2]).toMatchSnapshot();
    expect(store.getActions()[3]).toMatchSnapshot();
  });
});
