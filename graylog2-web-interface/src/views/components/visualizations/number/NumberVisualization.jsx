// @flow strict
import React, { useContext, useEffect, useRef } from 'react';
import styled from 'styled-components';
import type { StyledComponent } from 'styled-components';
import { SizeMe } from 'react-sizeme';

import type { Rows } from 'views/logic/searchtypes/pivot/PivotHandler';
import connect from 'stores/connect';
import fieldTypeFor from 'views/logic/fieldtypes/FieldTypeFor';
import Value from 'views/components/Value';
import { ViewStore } from 'views/stores/ViewStore';
import DecoratedValue from 'views/components/messagelist/decoration/DecoratedValue';
import CustomHighlighting from 'views/components/messagelist/CustomHighlighting';
import RenderCompletionCallback from 'views/components/widgets/RenderCompletionCallback';
import NumberVisualizationConfig from 'views/logic/aggregationbuilder/visualizations/NumberVisualizationConfig';
import type {
  VisualizationComponent,
  VisualizationComponentProps,
} from 'views/components/aggregationbuilder/AggregationBuilder';
import { makeVisualization } from 'views/components/aggregationbuilder/AggregationBuilder';

import Trend from './Trend';
import AutoFontSizer from './AutoFontSizer';

import type { CurrentViewType } from '../../CustomPropTypes';

const GridContainer: StyledComponent<{}, {}, HTMLDivElement> = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 4fr 1fr;
  grid-column-gap: 0;
  grid-row-gap: 0;
  height: 100%;
  width: 100%;
`;

const SingleItemGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  grid-column-gap: 0;
  grid-row-gap: 0;
  height: 100%;
  width: 100%;
`;

const NumberBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  text-align: center;
  padding-bottom: 10px;
`;

const TrendBox = styled.div`
  height: 100%;
  width: 100%;
`;

const _extractValueAndField = (rows: Rows) => {
  if (!rows || !rows[0]) {
    return { value: undefined, field: undefined };
  }

  const results = rows[0];

  if (results.source === 'leaf') {
    const leaf = results.values.find((f) => f.source === 'row-leaf');

    if (leaf && leaf.source === 'row-leaf') {
      return { value: leaf.value, field: leaf.key[0] };
    }
  }

  return { value: undefined, field: undefined };
};

type Props = {
  currentView: CurrentViewType,
} & VisualizationComponentProps;

const _extractFirstSeriesName = (config) => {
  const { series = [] } = config;

  return series.length === 0
    ? undefined
    : series[0].function;
};

type NumberVisualizationConfigType = {
  +visualizationConfig: NumberVisualizationConfig,
};

const NumberVisualization = ({ config, currentView, fields, data }: Props) => {
  const targetRef = useRef();
  const onRenderComplete = useContext(RenderCompletionCallback);
  // $FlowFixMe: We know it is the correct subclass
  const numberVisualizationConfig = (config: NumberVisualizationConfigType);
  const { visualizationConfig = NumberVisualizationConfig.create() } = numberVisualizationConfig;

  const field = _extractFirstSeriesName(config);

  useEffect(onRenderComplete, [onRenderComplete]);
  const { activeQuery } = currentView;
  const chartRows = data.chart || Object.values(data)[0];
  const trendRows = data.trend;
  const { value } = _extractValueAndField(chartRows);
  const { value: previousValue } = _extractValueAndField(trendRows || []);

  if (!field || (value !== 0 && !value)) {
    return 'N/A';
  }

  const Container = visualizationConfig.trend ? GridContainer : SingleItemGrid;

  return (
    <Container>
      <NumberBox>
        <SizeMe monitorHeight monitorWidth>
          {({ size }) => (
            <AutoFontSizer height={size.height} width={size.width}>
              <CustomHighlighting field={field} value={value}>
                <Value field={field}
                       type={fieldTypeFor(field, fields)}
                       value={value}
                       queryId={activeQuery}
                       render={DecoratedValue} />
              </CustomHighlighting>
            </AutoFontSizer>
          )}
        </SizeMe>
      </NumberBox>
      {visualizationConfig.trend && (
        <TrendBox>
          <SizeMe monitorHeight monitorWidth>
            {({ size }) => (
              <AutoFontSizer height={size.height} width={size.width} target={targetRef}>
                <Trend ref={targetRef}
                       current={value}
                       previous={previousValue}
                       trendPreference={visualizationConfig.trendPreference} />
              </AutoFontSizer>
            )}
          </SizeMe>
        </TrendBox>
      )}
    </Container>
  );
};

const ConnectedNumberVisualization: VisualizationComponent = makeVisualization(connect(NumberVisualization, { currentView: ViewStore }), 'numeric');

export default ConnectedNumberVisualization;
