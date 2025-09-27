import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { generateItinerary } from '../../utils/apiService';
import "../../styles/TripInputPage.css";
import "react-datepicker/dist/react-datepicker.css";



function TripInputPage() {
  const [startDate, setStartDate] = useState(new Date('2025-09-20'));
  const [endDate, setEndDate] = useState(new Date('2025-09-22'));
  const [dayPrompts, setDayPrompts] = useState(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAddDay = () => setDayPrompts([...dayPrompts, '']);

  const handlePromptChange = (index, value) => {
    const newPrompts = [...dayPrompts];
    newPrompts[index] = value;
    setDayPrompts(newPrompts);
  };

  const handleExample = () => {
    setDayPrompts([
      'I want to go shopping at a mall, I want to go to a Cirque to watch a show for entertainment',
      'I want to eat at a korean restaurant, go on a sky capsule ride, go to a luxurious italian restaurant, and drink at a jazz club'
    ]);
  };

  // ✨ REWRITTEN SUBMIT HANDLER
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Helper to format dates to "YYYY-MM-DD"
    const formatDate = (date) => date.toISOString().split('T')[0];

    const requestBody = {
      // Filter out any empty day prompts the user might have left
      queries: dayPrompts.filter(prompt => prompt.trim() !== ''),
      user_lat: 35.1796,
      user_lon: 129.0756,
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
    };

    try {
      const itineraryData = await generateItinerary(requestBody);
      if (itineraryData) {
        navigate('/itinerary', { state: { itineraryData } });
      } else {
        setError('Failed to generate itinerary. The response was empty. Please try again.');
      }
    } catch (apiError) {
      console.error(apiError);
      setError('An error occurred while contacting the server. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="trip-input-page">
      <div className="trip-input-content">
        <div className="trip-form-container">
          <h1 className="trip-form-title">Plan Your Trip</h1>
        </div>

        <Card className="trip-form-card">
          <Card.Body>
            <p className="text-center text-muted mb-5">
              Enter your trip dates and tell us what you'd like to do each day. Be descriptive!
            </p>
            <Form onSubmit={handleSubmit}>
              <Row className="mb-4 align-items-center">
                <Col md={6} className="mb-3 mb-md-0">
                  <Form.Group>
                    <Form.Label>From</Form.Label>
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => setStartDate(date)}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      className="form-control"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>To</Form.Label>
                    <DatePicker
                      selected={endDate}
                      onChange={(date) => setEndDate(date)}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate}
                      className="form-control"
                    />
                  </Form.Group>
                </Col>
              </Row>

              {dayPrompts.map((prompt, index) => (
                <Form.Group key={index} className="mb-3">
                  <Form.Label>Day {index + 1}</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="e.g., A visit to a historical temple and a traditional Korean BBQ dinner."
                    value={prompt}
                    onChange={(e) => handlePromptChange(index, e.target.value)}
                  />
                </Form.Group>
              ))}

              <Button variant="outline-secondary" onClick={handleAddDay} className="mb-4">
                + Add Day
              </Button>

              <div className="p-3 mb-4 rounded instructions-box">
                <p className="fw-bold">How to get the best results:</p>
                <ul className="small text-muted">
                  <li>Mention specific interests like "history," "food," "beaches," or "hiking."</li>
                  <li>Include the general vibe: "a relaxed pace" or "a packed, adventurous day."</li>
                </ul>
                <Button variant="link" size="sm" onClick={handleExample} className="p-0">
                  Show an example
                </Button>
              </div>

              {/* ✨ ADD ERROR MESSAGE DISPLAY */}
              {error && <Alert variant="danger" className="mt-4">{error}</Alert>}

              <div className="d-grid">
                <Button variant="primary" type="submit" size="lg" disabled={isLoading}>
                  {/* ✨ UPDATE BUTTON TEXT BASED ON LOADING STATE */}
                  {isLoading ? 'Generating...' : 'Generate Itinerary'}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default TripInputPage;