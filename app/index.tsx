import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, Alert, FlatList, TouchableOpacity, ScrollView } from "react-native";
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';
import { GOOGLE_PLACES_API_KEY } from '@env';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    verticalAlign: "top",
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'regular',
    textAlign: "left",
    alignContent: "flex-start",
    marginTop: 12,
    marginBottom: 12,
  },
  input: {
    width: '100%',
    height: 50,
    padding: 16,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  output: {
    fontSize: 16,
    marginTop: 10,
    color: '#333',
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff"
  },
  list: {
    flex: 1,
    padding: 16,
    backgroundColor: "#ffffff"
  },
  listItem: {
    padding: 15,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
});

const App = () => {
  const inputTypeStarting = 1
  const inputTypeDestination = 2

  const mapRef = useRef(null);

  const [firstInput, setFirstInput] = useState('');
  const [secondInput, setSecondInput] = useState('');
  const [firstInputGeocode, setFirstInputGeocode] = useState(null);
  const [secondInputGeocode, setSecondInputGeocode] = useState(null);
  const [places, setPlaces] = useState([]);
  const [placesInputType, setPlacesInputType] = useState(0)
  const [firstInputPlaceId, setFirstInputPlaceId] = useState('');
  const [secondInputPlaceId, setSecondInputPlaceId] = useState('');
  const [directions, setDirections] = useState(null);

  const COMPONENT_RESTRICTIONS = 'country:lk'
  
  const fetchPlaces = async (query: String, inputType: Number) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
        {
          params: {
            input: query,
            key: GOOGLE_PLACES_API_KEY,
            components: COMPONENT_RESTRICTIONS,
          },
        }
      );
      setPlacesInputType(inputType);
      setPlaces(response.data.predictions);
    } catch (error) {
      console.error('API Call Error:', error);
    }
  };

  const fetchDirections = async (originPlaceId: String, destinationPlaceId: String, mode = 'driving') => {
    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/directions/json',
        {
          params: {
            origin: `place_id:${originPlaceId}`,
            destination: `place_id:${destinationPlaceId}`,
            mode: mode, // Options: driving, walking, bicycling, transit
            key: GOOGLE_PLACES_API_KEY,
          },
        }
      );
      setDirections(response.data);
    } catch (error) {
      console.error('Error fetching directions:', error);
    }
  };

  const fetchGeocode = async (placeId: String, inputType: Number) => {
    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            place_id: placeId,
            key: GOOGLE_PLACES_API_KEY,
          },
        }
      );

      const location = response.data.results[0].geometry.location
      if (inputType == inputTypeStarting) {
        setFirstInputGeocode(location)
      } else if (inputType == inputTypeDestination) {
        setSecondInputGeocode(location)
      }

      if (mapRef && firstInputGeocode && secondInputGeocode) {
        mapRef.current.fitToCoordinates(
          [
            { latitude: firstInputGeocode.lat, longitude: firstInputGeocode.lng },
            { latitude: secondInputGeocode.lat, longitude: secondInputGeocode.lng },
          ],
          {
            edgePadding: { top: 150, right: 150, bottom: 150, left: 150 },
            animated: true,
          }
        );
    }

    } catch (error) {
      console.error('Error fetching directions:', error);
    }
  };

  const handleItemPress = (placeId: String, description: String) => {
    setPlaces([])
    if (placesInputType == inputTypeStarting) {
      setFirstInputPlaceId(placeId)
      setFirstInput(description)
      fetchGeocode(placeId, placesInputType)
    } else if (placesInputType == inputTypeDestination) {
      setSecondInputPlaceId(placeId)
      setSecondInput(description)
      fetchGeocode(placeId, placesInputType)
    }

    if (firstInputPlaceId != '' && secondInputPlaceId != '') {
      fetchDirections(firstInputPlaceId, secondInputPlaceId)
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider="google" // Use Google Maps
        ref={mapRef}
        initialRegion={{
          latitude: 0.0,
          longitude: 0.0,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.04,
        }}
      >
        {firstInputGeocode && <Marker
          coordinate={{
            latitude: firstInputGeocode.lat,
            longitude: firstInputGeocode.lng,
          }}
          title="Origin"
          description={firstInput}
        />}
        {secondInputGeocode && <Marker
          coordinate={{
            latitude: secondInputGeocode.lat,
            longitude: secondInputGeocode.lng,
          }}
          title="Destination"
          description={secondInput}
        />}
      </MapView>
      <TextInput
        style={styles.input}
        placeholder="Your starting location"
        value={firstInput}
        onChangeText={(text) => {
          setDirections(null)
          setFirstInput(text)
          fetchPlaces(text, inputTypeStarting)
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="Your destination"
        value={secondInput}
        onChangeText={(text) => {
          setDirections(null)
          setSecondInput(text)
          fetchPlaces(text, inputTypeDestination)
        }}
      />
      {directions && <FlatList
        style={styles.info}
        data={directions.routes}
        keyExtractor={(item) => item.summary}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.listItem}>
            <Text style={styles.label}>{item.summary}</Text>
            <Text style={styles.label}>Distance: {
              item.legs.map((element, index) => (
                element.distance.value
              )).reduce((acc, curr) => (
                acc + curr, 0
              )) / 1000} KM</Text>
            <Text style={styles.label}>Duration: {
              Math.round(item.legs.map((element, index) => (
                element.duration.value
              )).reduce((acc, curr) => (
                acc + curr, 0
              )) / 60)} mins</Text>
          </TouchableOpacity>
        )}
      />}
      {places && places.length > 0 && <FlatList
        style={styles.list}
        data={places}
        keyExtractor={(item) => item.place_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listItem}
            onPress={
              () => handleItemPress(item.place_id, item.description)
            }>
            <Text>{item.description}</Text>
          </TouchableOpacity>
        )}
      />}
    </View>
  );
}

export default App;
