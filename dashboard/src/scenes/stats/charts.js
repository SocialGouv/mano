import React from 'react';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import HelpButtonAndModal from '../../components/HelpButtonAndModal';

export const CustomResponsivePie = ({ data = [], title, onItemClick, help }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const onClick = ({ id }) => {
    if (!onItemClick) return;
    onItemClick(id);
  };

  return (
    <div className="tw-my-4 tw-mx-0 tw-flex tw-w-full tw-break-inside-avoid tw-flex-wrap tw-items-center tw-justify-between tw-rounded-2xl tw-border tw-border-main25 tw-bg-white tw-p-4">
      <div
        className={[
          'tw-relative tw-mt-4 tw-mb-12 tw-flex tw-basis-full tw-justify-center',
          data.length > 40 ? 'print:!tw-mb-4 print:!tw-mt-0' : '',
        ].join(' ')}>
        <p className="tw-m-0 tw-inline-block tw-text-center tw-text-lg tw-font-medium tw-text-black">
          {title} {!!help && <HelpButtonAndModal title={title} help={help} />}
        </p>
      </div>
      <div className="tw-flex tw-basis-1/3 tw-items-center tw-justify-center print:tw-max-h-screen">
        <table
          className={['tw-w-full tw-border-zinc-400 [&_td]:tw-p-1', data.length > 40 ? 'print:![font-size:14px] [&_td]:print:!tw-p-0' : ''].join(
            ' '
          )}>
          <tbody>
            {[...data]
              .sort((a, b) => (a.value < b.value ? 1 : -1))
              .map(({ key, label, value }) => (
                <tr key={key + label + value} onClick={() => onClick({ id: label })}>
                  <td className="tw-border tw-border-zinc-400 [overflow-wrap:anywhere]">{label}</td>
                  <td className="tw-border tw-border-zinc-400 tw-text-center">{value}</td>
                  {total ? <td className="tw-border tw-border-zinc-400 tw-text-center">{`${Math.round((value / total) * 1000) / 10}%`}</td> : <></>}
                </tr>
              ))}
            <tr>
              <td className="tw-border tw-border-zinc-400 tw-font-bold">Total</td>
              <td className="tw-border tw-border-zinc-400 tw-text-center tw-font-bold">{total}</td>
              {total ? <td className="tw-border tw-border-zinc-400 tw-text-center tw-font-bold">100%</td> : <></>}
            </tr>
          </tbody>
        </table>
      </div>
      <div
        className={[
          'tw-flex tw-h-80 tw-max-w-[50%] tw-basis-1/2 tw-items-center tw-justify-center tw-font-bold print:tw-w-[600px] print:tw-max-w-[55%] print:!tw-grow print:!tw-basis-0',
          !!onItemClick ? '[&_path]:tw-cursor-pointer' : '',
        ].join(' ')}>
        <ResponsivePie
          data={total ? data : []}
          sortByValue
          fit
          margin={{ top: 40, right: 0, bottom: 40, left: 0 }}
          innerRadius={0.5}
          padAngle={0.7}
          cornerRadius={3}
          startAngle={360}
          endAngle={0}
          colors={{ scheme: 'set2' }}
          borderWidth={1}
          borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
          arcLinkLabelsSkipAngle={data.length > 20 ? 12 : 8}
          arcLabelsSkipAngle={data.length > 20 ? 12 : 8}
          enableArcLinkLabels
          onClick={onClick}
          sliceLabelsTextColor="#333333"
          valueFormat={(value) => `${value} (${Math.round((value / total) * 1000) / 10}%)`}
        />
      </div>
    </div>
  );
};

const getItemValue = (item) => Object.values(item)[1];

export const CustomResponsiveBar = ({ title, data, categories, onItemClick, axisTitleX, axisTitleY, help }) => {
  const total = data.reduce((sum, item) => sum + getItemValue(item), 0);

  const onClick = ({ id }) => {
    if (!onItemClick) return;
    onItemClick(id);
  };

  return (
    <div className="tw-my-4 tw-mx-0 tw-flex tw-w-full tw-break-inside-avoid tw-flex-wrap tw-items-center tw-justify-between tw-rounded-2xl tw-border tw-border-main25 tw-bg-white tw-p-4">
      <div className="avoid tw-relative tw-mt-4 tw-mb-12 tw-flex tw-basis-full tw-justify-center">
        <p className="tw-m-0 tw-inline-block tw-text-center tw-text-lg tw-font-medium tw-text-black">
          {title} {!!help && <HelpButtonAndModal title={title} help={help} />}
        </p>
      </div>
      <div className="tw-flex tw-basis-1/3 tw-items-center tw-justify-center">
        <table className="tw-w-full tw-border tw-border-zinc-400">
          <tbody>
            {[...data].map((item) => (
              <tr key={item.name} onClick={() => onClick({ id: item.name })}>
                <td className="tw-border tw-border-zinc-400 tw-p-1">{item.name}</td>
                <td className="tw-border tw-border-zinc-400 tw-p-1 tw-text-center">{getItemValue(item)}</td>
                <td className="tw-border tw-border-zinc-400 tw-p-1 tw-text-center">{`${Math.round((getItemValue(item) / total) * 1000) / 10}%`}</td>
              </tr>
            ))}
            <tr>
              <td className="tw-border tw-border-zinc-400 tw-p-1 tw-font-bold">Total</td>
              <td className="tw-border tw-border-zinc-400 tw-p-1 tw-text-center tw-font-bold">{total}</td>
              <td className="tw-border tw-border-zinc-400 tw-p-1 tw-text-center tw-font-bold">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        className={[
          'tw-flex tw-h-80 tw-max-w-[50%] tw-basis-1/2 tw-items-center tw-justify-center tw-font-bold print:tw-w-[600px] print:tw-max-w-[60%] print:!tw-grow print:!tw-basis-0',
          !!onItemClick ? '[&_rect]:tw-cursor-pointer' : '',
        ].join(' ')}>
        <ResponsiveBar
          data={data.filter((c) => c.name !== 'Non renseigné')}
          keys={categories.filter((c) => c !== 'Non renseigné')}
          onClick={onClick}
          indexBy="name"
          margin={{ top: 40, right: 0, bottom: 50, left: 60 }}
          padding={0.3}
          valueScale={{ type: 'linear' }}
          indexScale={{ type: 'band', round: true }}
          colors={{ scheme: 'set2' }}
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
      </div>
    </div>
  );
};
