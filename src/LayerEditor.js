import React, { Fragment } from 'react';
import {
  EuiForm,
  EuiFormRow,
  EuiHorizontalRule,
  EuiSuperSelect,
  EuiSwitch,
} from '@elastic/eui';
import '@elastic/eui/dist/eui_theme_dark.css';
import './App.css';
import {
  colorKeyOptions,
  colorRampOptions,
  ellipseModeOptions,
  ellipseSearchDistances,
  ellipseUnitsOptions,
  gridResolutionOptions,
  pointModeOptions,
  spanRangeOptions,
  spreadRangeOptions,
} from './options';

/**
 * Wrapper around `handlePropertyChange` callback
 *
 * @param {function(string, any): void} handlePropertyChange
 * @param {string} propertyName
 * @returns {function(any): void}
 */
const onSelectChange = (handlePropertyChange, propertyName) => {
  return (selectedValue) => handlePropertyChange(propertyName, selectedValue);
};

const renderStyleConfiguration = (properties, handlePropertyChange) => {
  const {
    showEllipses,
    spanRange,
    spread,
    gridResolution,
    ellipseUnits,
    ellipseSearchDistance,
    numericFields,
    ellipseMajor,
    ellipseMinor,
    ellipseTilt,
  } = properties;
  const ellipsesSwitch = (
    <EuiFormRow label="Render Mode" display="columnCompressed">
      <EuiSwitch
        label="Show ellipses"
        checked={showEllipses}
        onChange={(e) => handlePropertyChange('showEllipses', e.target.checked)}
        compressed
      />
    </EuiFormRow>
  );

  // Common styling options for both points as well as ellipses
  const baseConfigs = [
    {
      label: 'Dynamic Range',
      options: spanRangeOptions,
      valueOfSelected: spanRange,
      propName: 'spanRange',
    },
  ];

  // Common styling options for just points
  const pointStyleConfigs = baseConfigs.concat([
    {
      label: 'Point Size',
      options: spreadRangeOptions,
      valueOfSelected: spread,
      propName: 'spread',
    },
    {
      label: 'Grid Resolution',
      options: gridResolutionOptions,
      valueOfSelected: gridResolution,
      propName: 'gridResolution',
    },
  ]);

  // Common styling options for just ellipses
  const ellipseStyleConfigs = baseConfigs.concat([
    {
      label: 'Ellipse Major',
      options: numericFields,
      valueOfSelected: ellipseMajor,
      propName: 'ellipseMajor',
    },
    {
      label: 'Ellipse Minor',
      options: numericFields,
      valueOfSelected: ellipseMinor,
      propName: 'ellipseMinor',
    },
    {
      label: 'Ellipse Tilt',
      options: numericFields,
      valueOfSelected: ellipseTilt,
      propName: 'ellipseTilt',
    },
    {
      label: 'Ellipse Units',
      options: ellipseUnitsOptions,
      valueOfSelected: ellipseUnits,
      propName: 'ellipseUnits',
    },
    {
      label: 'Ellipse Search Distance',
      options: ellipseSearchDistances,
      valueOfSelected: ellipseSearchDistance,
      propName: 'ellipseSearchDistance',
    },
  ]);

  const configToShow = !showEllipses ? pointStyleConfigs : ellipseStyleConfigs;
  return (
    <Fragment>
      {ellipsesSwitch}
      <Fragment>
        {configToShow.map((cfg) => (
          <EuiFormRow key={cfg.label} label={cfg.label} display="rowCompressed">
            <EuiSuperSelect
              label={cfg.label}
              options={cfg.options}
              valueOfSelected={cfg.valueOfSelected}
              onChange={onSelectChange(handlePropertyChange, cfg.propName)}
            />
          </EuiFormRow>
        ))}
      </Fragment>
    </Fragment>
  );
};

/**
 *
 *
 * @param {string} colorRampName
 * @param {function(string, any): void} handlePropertyChange
 * @returns {*}
 */
const renderHeatColorStyleConfiguration = (
  colorRampName,
  handlePropertyChange
) => {
  return (
    <EuiFormRow label="Color Map" display="rowCompressed">
      <EuiSuperSelect
        options={colorRampOptions}
        onChange={onSelectChange(handlePropertyChange, 'colorRampName')}
        valueOfSelected={colorRampName}
        hasDividers={true}
        compressed
      />
    </EuiFormRow>
  );
};

const renderCategoricalColorStyleConfiguration = (
  colorKeyName,
  handlePropertyChange,
  selectedIndexFields,
  selectedIndexField
) => {
  const displayableIndexFields = selectedIndexFields.map((field) => ({
    value: field.name,
    inputDisplay: field.name,
  }));
  return (
    <Fragment>
      <EuiFormRow label="Value" display="rowCompressed">
        <EuiSuperSelect
          options={displayableIndexFields}
          onChange={onSelectChange(handlePropertyChange, 'selectedIndexField')}
          valueOfSelected={selectedIndexField}
          compressed
        />
      </EuiFormRow>
      <EuiFormRow label="Color Map" display="rowCompressed">
        <EuiSuperSelect
          options={colorKeyOptions}
          onChange={onSelectChange(handlePropertyChange, 'colorKeyName')}
          valueOfSelected={colorKeyName}
          hasDividers={true}
          compressed
        />
      </EuiFormRow>
    </Fragment>
  );
};

const renderColorStyleConfiguration = (properties, handlePropertyChange) => {
  const {
    colorRampName,
    showEllipses,
    mode,
    colorKeyName,
    selectedIndexFields,
    selectedIndexField,
  } = properties;
  const styleConfig =
    mode === 'heat'
      ? renderHeatColorStyleConfiguration(colorRampName, handlePropertyChange)
      : renderCategoricalColorStyleConfiguration(
          colorKeyName,
          handlePropertyChange,
          selectedIndexFields,
          selectedIndexField
        );
  return (
    <Fragment>
      <EuiFormRow label="Color" display="rowCompressed">
        <EuiSuperSelect
          label="Color Mode"
          options={!showEllipses ? pointModeOptions : ellipseModeOptions}
          valueOfSelected={mode}
          hasDividers={true}
          compressed
          onChange={onSelectChange(handlePropertyChange, 'mode')}
        />
      </EuiFormRow>
      {styleConfig}
    </Fragment>
  );
};

function LayerEditor({ properties, handlePropertyChange }) {
  return (
    <EuiForm component="form">
      {renderColorStyleConfiguration(properties, handlePropertyChange)}
      <EuiHorizontalRule margin="xs" />
      {renderStyleConfiguration(properties, handlePropertyChange)}
    </EuiForm>
  );
}

export default LayerEditor;
