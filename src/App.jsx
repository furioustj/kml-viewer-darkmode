import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Table } from 'react-bootstrap';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import * as toGeoJSON from '@tmcw/togeojson';
import L from 'leaflet';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import './App.css';  // Custom styles here!

function App() {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [details, setDetails] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const parser = new DOMParser();
      const kml = parser.parseFromString(event.target.result, 'text/xml');
      const converted = toGeoJSON.kml(kml);
      setGeoJsonData(converted);
    };
    reader.readAsText(file);
  };

  const handleSummary = () => {
    if (!geoJsonData) return;
    const counts = {};
    geoJsonData.features.forEach((feature) => {
      const type = feature.geometry.type;
      counts[type] = (counts[type] || 0) + 1;
    });
    setSummary(counts);
    setDetails(null);
  };

  const handleDetails = () => {
    if (!geoJsonData) return;
    const detailsArray = geoJsonData.features.map((feature, index) => {
      const type = feature.geometry.type;
      let length = 0;

      if (type === 'LineString') {
        length = calculateLength(feature.geometry.coordinates);
      } else if (type === 'MultiLineString') {
        feature.geometry.coordinates.forEach(line => {
          length += calculateLength(line);
        });
      }

      return { index: index + 1, type, length: length.toFixed(2) + ' km' };
    });
    setDetails(detailsArray);
    setSummary(null);
  };

  const calculateLength = (coords) => {
    let total = 0;
    coords.forEach((coord, index) => {
      if (index === 0) return;
      const from = L.latLng(coords[index - 1][1], coords[index - 1][0]);
      const to = L.latLng(coord[1], coord[0]);
      total += from.distanceTo(to);
    });
    return total / 1000;
  };

  const renderSummaryTable = () => (
    <Table striped bordered hover variant="dark" className="mt-3">
      <thead>
        <tr>
          <th>Element Type</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(summary).map(([type, count]) => (
          <tr key={type}>
            <td>{type}</td>
            <td>{count}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  const renderDetailsTable = () => (
    <Table striped bordered hover variant="dark" className="mt-3">
      <thead>
        <tr>
          <th>#</th>
          <th>Element Type</th>
          <th>Total Length</th>
        </tr>
      </thead>
      <tbody>
        {details.map((item) => (
          <tr key={item.index}>
            <td>{item.index}</td>
            <td>{item.type}</td>
            <td>{item.length}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  const renderMap = () => (
    <MapContainer center={[0, 0]} zoom={2} style={{ height: '500px' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
      />
      <GeoJSON data={geoJsonData} />
    </MapContainer>
  );

  return (
    <Container fluid className="py-4">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card bg="dark" text="light" className="mb-4 shadow-lg">
            <Card.Body>
              <Card.Title className="text-center mb-4">KML File Viewer</Card.Title>

              <Form.Group controlId="formFile" className="mb-3">
                <Form.Label>Upload KML File</Form.Label>
                <Form.Control type="file" onChange={handleFileUpload} />
              </Form.Group>

              <div className="d-flex justify-content-center gap-3">
                <Button variant="primary" onClick={handleSummary}>Summary</Button>
                <Button variant="secondary" onClick={handleDetails}>Details</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {summary && (
        <Row className="justify-content-center">
          <Col md={8}>
            <Card bg="dark" text="light" className="mb-4 shadow">
              <Card.Body>
                <Card.Title>Summary</Card.Title>
                {renderSummaryTable()}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {details && (
        <Row className="justify-content-center">
          <Col md={8}>
            <Card bg="dark" text="light" className="mb-4 shadow">
              <Card.Body>
                <Card.Title>Details</Card.Title>
                {renderDetailsTable()}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {geoJsonData && (
        <Row className="justify-content-center">
          <Col md={10}>
            <Card bg="dark" text="light" className="shadow">
              <Card.Body style={{ height: '500px' }}>
                {renderMap()}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default App;
