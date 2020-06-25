import React from 'react';
import axios from 'axios';
import { chain, keys, forOwn } from 'lodash';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl-csp';
import moment from 'moment';
import {
  EuiDatePicker,
  EuiDatePickerRange,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiPageSideBar,
  EuiSearchBar,
  EuiSuperSelect,
} from '@elastic/eui';
import LayerEditor from './LayerEditor.js';
import '@elastic/eui/dist/eui_theme_dark.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';
import { isNumeric, isAggregatable } from './util';

const BASE_URL =
  process.env.REACT_APP_DATASHADER_URL || 'http://localhost:5000';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      startDate: moment().subtract(1, 'd'),
      endDate: moment(),
      timestampField: '@timestamp',
      geoPointField: 'location',
      mode: 'heat',
      spanRange: 'normal',
      gridResolution: 'fine',
      spread: 'auto',
      showEllipses: false,
      ellipseUnits: '',
      ellipseSearchDistance: 'narrow',
      colorRampName: 'bmy',
      colorKeyName: 'glasbey_light',
      indices: [],
      selectedIndex: '',
      selectedIndexFields: {},
      selectedIndexField: '',
      query: '',
      filters: [],
      ellipseMajor: '',
      ellipseMinor: '',
      ellipseTilt: '',
      radius: 20,
      fromPage: 0,
      pageSize: 100,
      highlightedValue: '',
    };
    this.mbMap = null;
    this.handlePropertyChange = this.handlePropertyChange.bind(this);
    this.handleIndexChange = this.handleIndexChange.bind(this);
    this.setupMap = this.setupMap.bind(this);
    this.populateIndices = this.populateIndices.bind(this);
  }

  /**
   * Generic property change handler
   *
   * Note: This calls `this.updateUrl` after setting state,
   * which will fire off a new request.
   *
   * @param {string} propertyName
   * @param {any} propertyValue
   */
  handlePropertyChange(propertyName, propertyValue) {
    this.setState({ [propertyName]: propertyValue }, this.updateUrl);
  }

  /**
   * Handle index selection
   *
   * @param {string} selectedIndex
   */
  handleIndexChange(selectedIndex) {
    axios
      .get(`${BASE_URL}/indices/${selectedIndex}/field_caps`)
      .then((result) => {
        this.setState(
          {
            selectedIndex,
            selectedIndexFields: result.data.fields,
          },
          this.updateUrl
        );
      })
      .catch((err) => {
        console.error(err);
      });
  }

  /**
   *
   */
  updateUrl() {
    if (this.mbMap.getLayer('datashader-layer')) {
      this.mbMap.removeLayer('datashader-layer');
    }
    if (this.mbMap.getSource('datashader')) {
      this.mbMap.removeSource('datashader');
    }

    const {
      startDate,
      endDate,
      timestampField,
      geoPointField,
      mode,
      spanRange,
      gridResolution,
      spread,
      showEllipses,
      ellipseUnits,
      ellipseSearchDistance,
      colorRampName,
      colorKeyName,
      selectedIndex,
      selectedIndexFields,
      selectedIndexField,
      query,
      filters,
      ellipseMajor,
      ellipseMinor,
      ellipseTilt,
      highlightedValue,
    } = this.state;

    // Can't move forward without an index
    if (selectedIndex === '') {
      return;
    }

    // Build up the params JSON
    const params = {
      timeFilters: {
        from: startDate,
        to: endDate,
      },
      filters,
    };

    if (query !== '' && query.queryText !== '') {
      console.log(query);
      params.query = {
        language: 'dsl',
        query: {
          query_string: {
            query: query.queryText,
          },
        },
      };
    }

    const cmap = mode === 'heat' ? colorRampName : colorKeyName;
    const tmsBase = `${BASE_URL}/tms/${selectedIndex}/{z}/{x}/{y}.png?`;

    // TODO: Maybe use `new URLSearchParams(object).toString()` instead
    const queryParams = [
      `params=${JSON.stringify(params)}`,
      `timestamp_field=${timestampField}`,
      `geopoint_field=${geoPointField}`,
      `span=${spanRange}`,
      `spread=${spread}`,
      `resolution=${gridResolution}`,
      `cmap=${cmap}`,
    ];
    if (mode === 'category' && selectedIndexField !== '') {
      const selectedFieldDef = selectedIndexFields[selectedIndexField];
      if (selectedFieldDef) {
        let type = keys(selectedFieldDef)[0]; // pick the first type if there are conflicts
        if (type === 'keyword') {
          type = 'string';
        }
        queryParams.push(
          `category_field=${selectedIndexField}`,
          `category_type=${type}`
        );
      } else {
        console.error(`No object found for ${selectedIndexField}`);
        return;
      }

      if (highlightedValue !== '') {
        queryParams.push(`highlight=${highlightedValue}`);
      }
    } else if (mode === 'category' && selectedIndexField === '') {
      return;
    }

    if (showEllipses) {
      queryParams.push(
        `ellipse_units=${ellipseUnits}`,
        `ellipse_search_distance=${ellipseSearchDistance}`,
        `ellipse_major=${ellipseMajor}`,
        `ellipse_minor=${ellipseMinor}`,
        `ellipse_tilt=${ellipseTilt}`,
        'ellipses=true'
      );
    }

    const url = tmsBase.concat(queryParams.join('&'));

    console.log('UPDATE URL', url);

    // Add the new TMS source to the map
    this.mbMap.addSource('datashader', {
      type: 'raster',
      tiles: [url],
      tileSize: 256,
      scheme: 'xyz',
    });

    this.mbMap.addLayer({
      id: 'datashader-layer',
      type: 'raster',
      source: 'datashader',
    });
  }

  setupMap() {
    const mapTileAttrib =
      '<a target="_top" rel="noopener" href="http://stamen.com">Stamen Design</a>';
    const license =
      '<a target="_top" rel="noopener" href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>';
    const osm =
      '<a target="_top" rel="noopener" href="http://openstreetmap.org">OpenStreetMap</a>';
    const attrib = `Map tiles by ${mapTileAttrib}, under ${license}. Data by ${osm}, under ${license}`;
    this.mbMap = new mapboxgl.Map({
      container: this.mapContainer,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: [
              'https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
            ],
            tileSize: 256,
            attribution: attrib,
          },
        },
        layers: [
          {
            id: 'simple-tiles',
            type: 'raster',
            source: 'raster-tiles',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
    });

    this.mbMap.on('load', () => {
      console.log('UPDATING MAP');
      this.updateUrl();

      this.mbMap.on('click', (e) => {
        const {
          startDate,
          endDate,
          filters,
          selectedIndex,
          radius,
          fromPage,
          pageSize,
        } = this.state;
        if (selectedIndex === '') {
          return;
        }
        const { lng, lat } = e.lngLat;
        const url = `${BASE_URL}/data/${selectedIndex}/${lat}/${lng}/${radius}`;
        const paramsDict = {
          timeFilters: {
            from: startDate,
            to: endDate,
          },
          filters,
        };
        const params = new URLSearchParams({
          params: JSON.stringify(paramsDict),
          from: fromPage,
          size: pageSize,
        });
        console.log(params.toString());
        const urlWithParams = `${url}?from=${fromPage}&size=${pageSize}`;
        console.log(urlWithParams);
        axios
          .get(urlWithParams)
          .then((result) => {
            console.log(result);
          })
          .catch((err) => console.error(err));
      });
    });

    this.mbMap.on('click', (e) => {
      // TODO call elastic datashader to get the info

      const popup = new mapboxgl.Popup({ closeOnClick: false })
        .setLngLat([e.lngLat.lng, e.lngLat.lat])
        .setHTML(
          `<h1 style="color: black">Lat: ${e.lngLat.lat} <br/> Lon: ${e.lngLat.lng}</h1>`
        )
        .addTo(this.mbMap);
    });
  }

  populateIndices() {
    axios
      .get(`${BASE_URL}/indices`)
      .then((result) => {
        const indices = result.data.indices.map((idx) => ({
          value: idx,
          inputDisplay: idx,
        }));
        this.setState({ indices });
      })
      .catch((err) => {
        console.error(err);
      });
  }

  componentDidMount() {
    this.setupMap();
    this.populateIndices();
  }

  render() {
    const initialQuery = EuiSearchBar.Query.MATCH_ALL;
    const {
      startDate,
      endDate,
      mode,
      spanRange,
      gridResolution,
      spread,
      showEllipses,
      ellipseUnits,
      ellipseSearchDistance,
      colorRampName,
      colorKeyName,
      indices,
      selectedIndex,
      selectedIndexFields,
      selectedIndexField,
      filters,
      ellipseMajor,
      ellipseMinor,
      ellipseTilt,
      highlightedValue,
    } = this.state;

    const datePicker = (
      <EuiDatePickerRange
        startDateControl={
          <EuiDatePicker
            selected={startDate}
            startDate={startDate}
            onChange={(date) => this.handlePropertyChange('startDate', date)}
            endDate={endDate}
            isInvalid={startDate > endDate}
            aria-label="Start date"
            showTimeSelect
          />
        }
        endDateControl={
          <EuiDatePicker
            selected={endDate}
            onChange={(date) => this.handlePropertyChange('endDate', date)}
            startDate={startDate}
            endDate={endDate}
            isInvalid={startDate > endDate}
            aria-label="End date"
            showTimeSelect
          />
        }
      />
    );

    const schema = {
      strict: true,
      fields: {},
    };

    forOwn(selectedIndexFields, (value, key) => {
      schema.fields[key] = keys(value)[0];
    });

    const aggregatableFields = chain(selectedIndexFields)
      .pickBy((value, key) => isAggregatable(value))
      .keys()
      .map((field) => ({
        value: field,
        inputDisplay: field,
      }))
      .value();

    const numericFields = chain(selectedIndexFields)
      .pickBy((value, key) => isNumeric(value))
      .keys()
      .map((field) => ({
        value: field,
        inputDisplay: field,
      }))
      .value();

    const styleProperties = {
      mode,
      spanRange,
      gridResolution,
      spread,
      showEllipses,
      ellipseUnits,
      ellipseSearchDistance,
      colorRampName,
      colorKeyName,
      indices,
      selectedIndexFields,
      selectedIndexField,
      numericFields,
      aggregatableFields,
      ellipseMajor,
      ellipseMinor,
      ellipseTilt,
      highlightedValue,
    };

    return (
      <EuiPage>
        <EuiPageSideBar>
          <LayerEditor
            properties={styleProperties}
            handlePropertyChange={this.handlePropertyChange}
          />
        </EuiPageSideBar>
        <EuiPageBody component="div">
          <EuiPageHeader>
            <EuiPageHeaderSection id="indexSelectHeader">
              <EuiSuperSelect
                options={indices}
                onChange={this.handleIndexChange}
                valueOfSelected={selectedIndex}
              />
            </EuiPageHeaderSection>
            <EuiPageHeaderSection id="searchHeader">
              <EuiSearchBar
                query={initialQuery}
                box={{
                  placeholder: 'e.g. type:visualization -is:active joe',
                  schema,
                }}
                filters={filters}
                onChange={(query) => this.handlePropertyChange('query', query)}
              />
            </EuiPageHeaderSection>
            <EuiPageHeaderSection id="dateHeader">
              {datePicker}
            </EuiPageHeaderSection>
          </EuiPageHeader>
          <EuiPageContent className="mainContent">
            <EuiPageContentBody className="mainContent">
              <div
                id="mapContainer"
                className="mapContainer"
                ref={(el) => (this.mapContainer = el)}
                data-test-subj="mapContainer"
              />
            </EuiPageContentBody>
          </EuiPageContent>
        </EuiPageBody>
      </EuiPage>
    );
  }
}

export default App;
