/* eslint-disable no-param-reassign */
import React, { useEffect } from 'react';
import {
  Row, Col, Space, Collapse, Skeleton, Select, Spin,
} from 'antd';

import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { Vega } from 'react-vega';
import DimensionsRangeEditor from '../components/DimensionsRangeEditor';
import ColourInversion from '../components/ColourInversion';
import AxesDesign from '../components/AxesDesign';
import PointDesign from '../components/PointDesign';
import TitleDesign from '../components/TitleDesign';
import FontDesign from '../components/FontDesign';
import LegendEditor from '../components/LegendEditor';
import LabelsDesign from '../components/LabelsDesign';
import { updatePlotConfig, loadPlotConfig } from '../../../../../redux/actions/plots/index';
import { generateSpec } from '../../../../../utils/plotSpecs/generateEmbeddingCategoricalSpec';
import Header from '../components/Header';
import PlatformError from '../../../../../components/PlatformError';

import loadEmbedding from '../../../../../redux/actions/loadEmbedding';
import { loadCellSets } from '../../../../../redux/actions/cellSets';
import isBrowser from '../../../../../utils/environment';

const { Panel } = Collapse;

// TODO: when we want to enable users to create their custom plots,
// we will need to change this to proper Uuid
const plotUuid = 'embeddingCategoricalMain';
const plotType = 'embeddingCategorical';
const embeddingType = 'umap';

const route = {
  path: 'embedding-categorical',
  breadcrumbName: 'Categorical Embedding',
};

const EmbeddingCategoricalPlot = () => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.plots[plotUuid]?.config);
  const cellSets = useSelector((state) => state.cellSets);
  const { data, loading, error } = useSelector((state) => state.embeddings[embeddingType]) || {};

  const router = useRouter();
  const { experimentId } = router.query;

  useEffect(() => {
    if (isBrowser) {
      if (!data) {
        dispatch(loadEmbedding(experimentId, embeddingType));
      }
      dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
      dispatch(loadCellSets(experimentId));
    }
  }, [experimentId]);

  const generateCellSetOptions = () => {
    const hierarchy = cellSets.hierarchy.map(
      (cellSet) => ({ key: cellSet.key, children: cellSet.children?.length || 0 }),
    );
    return hierarchy.map(({ key, children }) => ({
      value: key,
      label: `${cellSets.properties[key].name} (${children} ${children === 1 ? 'child' : 'children'})`,
    }));
  };

  const generateData = (spec) => {
    // First, find the child nodes in the hirerarchy.
    let newCellSets = cellSets.hierarchy
      .find((rootNode) => rootNode.key === config.selectedCellSet)
      ?.children || [];

    // Build up the data source based on the properties. Note that the child nodes
    // in the hierarchy are /objects/ with a `key` property, hence the destructuring
    // in the function.
    newCellSets = newCellSets.map(({ key }) => ({ cellSetId: key, ...cellSets.properties[key] }));

    spec.data.forEach((datum) => {
      if (datum.name === 'cellSets') {
        datum.values = newCellSets;
      } else if (datum.name === 'embedding') {
        datum.values = data;
      }
    });
  };

  if (!config) {
    return (<Skeleton />);
  }

  const renderPlot = () => {
    if (error) {
      return (
        <PlatformError
          description={error}
          onClick={() => dispatch(loadEmbedding(experimentId, embeddingType))}
        />
      );
    }
    if (!config || !data || loading || !isBrowser) {
      return (<center><Spin size='large' /></center>);
    }
    return (
      <center>
        <Vega spec={vegaSpec} renderer='canvas' />
      </center>
    );
  };

  const vegaSpec = generateSpec(config);
  // due to a bug in vega with React with using data with source coming from other data,
  // we have to inject the data in the Vega spec.
  generateData(vegaSpec);

  const onUpdate = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  const onCellSetSelect = ({ value }) => {
    onUpdate({ selectedCellSet: value });
  };

  return (
    <div style={{ paddingLeft: 32, paddingRight: 32 }}>
      <Header
        plotUuid={plotUuid}
        experimentId={experimentId}
        finalRoute={route}
      />
      <Row gutter={16}>
        <Col span={16}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Collapse defaultActiveKey={['1']}>
              <Panel header='Preview' key='1'>
                {renderPlot()}
              </Panel>
            </Collapse>
          </Space>
        </Col>
        <Col span={8}>
          <Space direction='vertical' style={{ width: '100%' }} />
          <Collapse accordion defaultActiveKey={['1']}>
            <Panel header='Group by' key='6'>
              <p>Select the cell set category you would like to group cells by.</p>
              <Space direction='vertical' style={{ width: '100%' }}>
                <Select
                  labelInValue
                  style={{ width: '100%' }}
                  placeholder='Select cell set...'
                  value={{ key: config.selectedCellSet }}
                  options={generateCellSetOptions()}
                  onChange={onCellSetSelect}
                />
              </Space>
            </Panel>
            <Panel header='Main Schema' key='2'>
              <DimensionsRangeEditor
                config={config}
                onUpdate={onUpdate}
              />
              <Collapse accordion defaultActiveKey={['1']}>
                <Panel header='Define and Edit Title' key='6'>
                  <TitleDesign
                    config={config}
                    onUpdate={onUpdate}
                  />
                </Panel>
                <Panel header='Font' key='9'>
                  <FontDesign
                    config={config}
                    onUpdate={onUpdate}
                  />
                </Panel>
              </Collapse>
            </Panel>
            <Panel header='Axes and Margins' key='3'>
              <AxesDesign
                config={config}
                onUpdate={onUpdate}
              />
            </Panel>
            <Panel header='Colour Inversion' key='4'>
              <ColourInversion
                config={config}
                onUpdate={onUpdate}
              />
            </Panel>
            <Panel header='Markers' key='5'>
              <PointDesign
                config={config}
                onUpdate={onUpdate}
              />
            </Panel>
            <Panel header='Legend' key='10'>
              <LegendEditor
                onUpdate={onUpdate}
                legendEnabled={config.legendEnabled}
              />
            </Panel>
            <Panel header='Labels' key='11'>
              <LabelsDesign
                config={config}
                onUpdate={onUpdate}
              />
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
};

export default EmbeddingCategoricalPlot;
