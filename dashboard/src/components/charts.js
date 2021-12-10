/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import styled from 'styled-components';
import { ResponsivePie } from '@nivo/pie';

import { theme } from '../config';
import { Col, Row } from 'reactstrap';
import { ResponsiveBar } from '@nivo/bar';

export const CustomResponsivePie = ({ data, title, onAddFilter, field }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const onClick = ({ id }) => {
    if (!onAddFilter) return;
    onAddFilter({ value: id, field });
  };

  return (
    <CardWrapper>
      <Col md={12}>
        <CardTitle>{title}</CardTitle>
      </Col>
      <DataWrapper md={4}>
        <Data>
          <tbody>
            {[...data]
              .sort((a, b) => (a.value < b.value ? 1 : -1))
              .map(({ key, label, value }) => (
                <tr key={key + label + value}>
                  <td>{label}</td>
                  <td>{value}</td>
                  <td>{`${Math.round((value / total) * 1000) / 10}%`}</td>
                </tr>
              ))}
            <tr>
              <td>Total</td>
              <td>{total}</td>
              <td>100%</td>
            </tr>
          </tbody>
        </Data>
      </DataWrapper>
      <Col md={8}>
        <PieContainer>
          <ResponsivePie
            data={data}
            sortByValue
            fit
            margin={{ top: 40, right: 0, bottom: 40, left: 0 }}
            innerRadius={0.5}
            padAngle={0.7}
            cornerRadius={3}
            colors={{ scheme: 'nivo' }}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            arcLinkLabelsSkipAngle={8}
            arcLabelsSkipAngle={8}
            enableArcLinkLabels
            onClick={onClick}
            sliceLabelsTextColor="#333333"
            valueFormat={(value) => `${value} (${Math.round((value / total) * 1000) / 10}%)`}
          />
        </PieContainer>
      </Col>
    </CardWrapper>
  );
};

export const CustomResponsiveBar = ({ title, data, categories, axisTitleX, axisTitleY }) => {
  const getItemValue = (item) => Object.values(item)[1];
  const total = data.reduce((sum, item) => sum + getItemValue(item), 0);
  return (
    <CardWrapper>
      <Col md={12}>
        <CardTitle>{title}</CardTitle>
      </Col>
      <DataWrapper md={6}>
        <Data>
          <tbody>
            {[...data].map((item) => (
              <tr key={item.name}>
                <td>{item.name}</td>
                <td>{getItemValue(item)}</td>
                <td>{`${Math.round((getItemValue(item) / total) * 1000) / 10}%`}</td>
              </tr>
            ))}
            <tr>
              <td>Total</td>
              <td>{total}</td>
              <td>100%</td>
            </tr>
          </tbody>
        </Data>
      </DataWrapper>
      <Col md={6}>
        <BarContainer>
          <ResponsiveBar
            data={data}
            keys={categories}
            indexBy="name"
            margin={{ top: 40, right: 0, bottom: 50, left: 60 }}
            padding={0.3}
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={{ scheme: 'nivo' }}
            borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: axisTitleX,
              legendPosition: 'middle',
              legendOffset: 35,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: axisTitleY,
              legendPosition: 'middle',
              legendOffset: -50,
            }}
            labelSkipWidth={0}
            labelSkipHeight={0}
            labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
            legends={[
              {
                dataFrom: 'keys',
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 120,
                translateY: 0,
                itemsSpacing: 2,
                itemWidth: 100,
                itemHeight: 20,
                itemDirection: 'left-to-right',
                itemOpacity: 0.85,
                symbolSize: 20,
                effects: [{ on: 'hover', style: { itemOpacity: 1 } }],
              },
            ]}
            animate={true}
            motionStiffness={90}
            motionDamping={15}
          />
        </BarContainer>
      </Col>
    </CardWrapper>
  );
};

const CardWrapper = styled(Row)`
  background: ${theme.white};
  border-radius: 20px;
  padding-bottom: 30px;
  width: 100%;
`;

const DataWrapper = styled(Col)`
  justify-content: center;
  align-items: center;
  display: flex;
`;

const Data = styled.table`
  flex-basis: 25%;
  flex-shrink: 0;
  flex-grow: 0;
  border: 1px solid #000;
  /* font-size: 0.7em; */
  td {
    border: 1px solid #000;
    padding: 5px;
  }

  td:nth-child(2),
  td:nth-child(3) {
    text-align: center;
  }

  tr:last-child {
    font-weight: bold;
  }
`;

const PieContainer = styled.div`
  height: 30vw;
  width: 100%;
  * {
    font-weight: bold;
  }
`;

const BarContainer = styled.div`
  height: 300px;
  width: 70%;
  * {
    font-weight: bold;
  }
`;

const CardTitle = styled.div`
  font-weight: bold;
  font-size: 16px;
  line-height: 24px;
  text-align: center;
  color: ${theme.black};
  margin-bottom: 15px;
`;
