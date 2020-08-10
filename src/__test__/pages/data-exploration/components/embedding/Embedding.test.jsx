import React from 'react';
import {
  Provider,
} from 'react-redux';
import { act } from 'react-dom/test-utils';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import preloadAll from 'jest-next-dynamic';
// eslint-disable-next-line import/extensions
import { Scatterplot } from 'vitessce/dist/es/production/scatterplot.min.js';
import Embedding from '../../../../../pages/data-exploration/components/embedding/Embedding';
import CrossHair from '../../../../../pages/data-exploration/components/embedding/CrossHair';
import CellInfo from '../../../../../pages/data-exploration/components/CellInfo';
import { CELL_SETS_CREATE } from '../../../../../redux/actionTypes/cellSets';
import { initialEmbeddingState } from '../../../../../redux/reducers/embeddings/initialState';

jest.mock('localforage');

const mockStore = configureMockStore([thunk]);
let component;
let store;

const initialState = {
  embeddings: {
    pca: {
      ...initialEmbeddingState,
      loading: false,
      data: [[-13, 32], [6, 7], [43, 9], [57, 3]],
    },
  },
  cellSets: {
    properties: {
      cluster1: {
        color: '#ff0000',
        cellIds: [2, 3],
      },
    },
    hierarchy: [
      {
        key: 'louvain',
        children: ['cluster1'],
      },
    ],
    selected: ['cluster1'],
  },
  genes: {
    expression: {
      loading: false,
      data: {},
    },
    focused: undefined,
  },
  cellInfo: {
    cellName: 2,
  },
};

describe('Embedding', () => {
  beforeAll(async () => {
    await preloadAll();
  });
  beforeEach(() => {
    // Clears the database and adds some testing data.
    store = mockStore(initialState);

    component = mount(
      <Provider store={store}>
        <Embedding experimentId='1234' embeddingType='pca' />
      </Provider>,
    );
  });

  afterEach(() => {
    component.unmount();
  });

  configure({ adapter: new Adapter() });


  test('renders correctly a PCA embedding', () => {
    const scatterplot = component.find(Scatterplot);
    expect(component.find('Embedding').length).toEqual(1);
    expect(scatterplot.length).toEqual(1);
    expect(scatterplot.getElement().props.mapping).toEqual('PCA');
    expect(scatterplot.getElement().props.cellColors).toEqual(
      {
        // cell #2 is selected, so it has a different color
        2: [0, 0, 0],
        3: [255, 0, 0],
      },
    );
    expect(scatterplot.getElement().props.cells).toEqual(
      {
        0: {
          mappings: {
            PCA: [-13, 32],
          },
        },
        1: {
          mappings: {
            PCA: [6, 7],
          },
        },
        2: {
          mappings: {
            PCA: [43, 9],
          },
        },
        3: {
          mappings: {
            PCA: [57, 3],
          },
        },
      },
    );
  });

  test('renders correctly a popover on lasso selection and closes it on cancel', () => {
    const scatterplot = component.find(Scatterplot);
    expect(component.find('ClusterPopover').length).toEqual(0);

    const selectedCellIds = new Set(['1', '2']);
    // lasso select cells 1 and 2
    act(() => {
      scatterplot.getElement().props.updateCellsSelection(selectedCellIds);
    });
    component.update();
    let popover = component.find('ClusterPopover');
    expect(popover.length).toEqual(1);

    // close the popover
    act(() => {
      popover.getElement().props.onCancel();
    });
    component.update();
    popover = component.find('ClusterPopover');
    expect(popover.length).toEqual(0);
    expect(store.getActions().length).toEqual(0);
  });

  test('does not render the popover after lasso selection of 0 cells', () => {
    const scatterplot = component.find(Scatterplot);
    const selectedCellIds = new Set();

    // lasso select cells 1 and 2
    act(() => {
      scatterplot.getElement().props.updateCellsSelection(selectedCellIds);
    });
    component.update();

    expect(component.find('ClusterPopover').length).toEqual(0);
  });

  test('does not render cell info and crosshair when the popover is open', () => {
    const scatterplot = component.find(Scatterplot);
    // lasso select cells 1 and 2
    const selectedCellIds = new Set(['1', '2']);
    act(() => {
      scatterplot.getElement().props.updateCellsSelection(selectedCellIds);
    });
    component.update();

    expect(component.find('ClusterPopover').length).toEqual(1);
    expect(component.find(CrossHair).length).toEqual(0);
    expect(component.find(CellInfo).length).toEqual(0);
  });

  test('renders correctly a popover on lasso selection and creates a new cluster on create', () => {
    const scatterplot = component.find(Scatterplot);
    expect(component.find('ClusterPopover').length).toEqual(0);

    // lasso select cells 1 and 2
    const selectedCellIds = new Set(['1', '2']);
    act(() => {
      scatterplot.getElement().props.updateCellsSelection(selectedCellIds);
    });
    component.update();
    const popover = component.find('ClusterPopover');
    expect(popover.length).toEqual(1);

    // click create in the popover
    act(() => {
      popover.getElement().props.onCreate();
    });
    component.update();

    expect(component.find('ClusterPopover').length).toEqual(0);
    expect(store.getActions().length).toEqual(2);
    expect(store.getActions()[0].type).toEqual(CELL_SETS_CREATE);
    expect(store.getActions()[0].payload.cellIds).toEqual(Array.from(selectedCellIds));
  });

  test('dispatches an action with updated cell information on hover', () => {
    const scatterplot = component.find(Scatterplot);

    const hoveredCell = { cellId: 1 };

    // hover over cells
    act(() => {
      scatterplot.getElement().props.updateCellsHover(hoveredCell);
    });

    expect(store.getActions().length).toEqual(1);
    expect(store.getActions()[0].type).toEqual('UPDATE_CELL_INFO');
    expect(store.getActions()[0].data.cellName).toEqual(hoveredCell.cellId);
  });

  test('renders CrossHair and CellInfo components when user hovers over cell', () => {
    store = mockStore(initialState);

    const mockProject = jest.fn(([x, y]) => [x + 1, y + 1]);

    const cellCoordinates = {
      viewport: {
        project: mockProject,
        width: 100,
        height: 200,
      },
    };

    component = mount(
      <Provider store={store}>
        <Embedding experimentId='1234' embeddingType='pca' />
      </Provider>,
    );
    const scatterplot = component.find(Scatterplot);

    // hover over cells
    act(() => {
      scatterplot.getElement().props.updateViewInfo(cellCoordinates);
    });

    const crossHairs = component.find(CrossHair);
    const cellInfo = component.find(CellInfo);

    expect(mockProject).toHaveBeenCalledTimes(1);
    expect(mockProject).toHaveBeenCalledWith(store.getState().embeddings.pca.data[2]);
    expect(crossHairs.length).toEqual(1);
    expect(crossHairs.props().coordinates.current).toEqual(
      {
        x: 44,
        y: 10,
        width: 100,
        height: 200,
      },
    );
    expect(cellInfo.length).toEqual(1);
    expect(crossHairs.props().coordinates.current).toEqual(crossHairs.props().coordinates.current);
  });

  it('the gene expression view gets rendered correctly', () => {
    const focusedState = {
      ...initialState,
      cellSets: {
        ...initialState.cellSets,
        selected: [],
      },
      genes: {
        ...initialState.genes,
        focused: 'REALGENE',
        expression: {
          loading: [],
          data: {
            REALGENE: {
              min: 0,
              max: 1.6,
              expression: [0, 0.4, 0.5, 1.6],
            },
          },
        },
      },
    };

    const geneExprStore = mockStore(focusedState);

    const embedding = mount(
      <Provider store={geneExprStore}>
        <Embedding experimentId='1234' embeddingType='pca' />
      </Provider>,
    );

    const legend = embedding.find('Embedding div img');
    expect(legend.length).toEqual(1);

    const focusedGeneInfo = embedding.find('Embedding div label strong');
    expect(focusedGeneInfo.length).toEqual(1);
    expect(focusedGeneInfo.props().children).toEqual('REALGENE');
  });
});
