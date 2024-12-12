import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Alert, FlatList, TouchableOpacity, ScrollView } from "react-native";
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
  listItem: {
    padding: 15,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
});

const App = () => {
  const inputTypeStarting = 1
  const inputTypeDestination = 2

  const [firstInput, setFirstInput] = useState('');
  const [secondInput, setSecondInput] = useState('');
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
      console.log("fetch directions: " + originPlaceId + " " + destinationPlaceId)
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
      console.log(response.data);
      setDirections(response.data);
    } catch (error) {
      console.error('Error fetching directions:', error);
    }
  };

  const handleItemPress = (placeId: String, description: String) => {
    setPlaces([])
    if (placesInputType == inputTypeStarting) {
      setFirstInputPlaceId(placeId)
      setFirstInput(description)
    } else if (placesInputType == inputTypeDestination) {
      setSecondInputPlaceId(placeId)
      setSecondInput(description)
    }

    if (firstInputPlaceId != '' && secondInputPlaceId != '') {
      fetchDirections(firstInputPlaceId, secondInputPlaceId)
    }
  };

  return (

    <View style={styles.container}>
      <Text style={styles.label}>Your starting location</Text>
      <TextInput
        style={styles.input}
        placeholder="Carnival"
        value={firstInput}
        onChangeText={(text) => {
          setDirections(null)
          setFirstInput(text)
          fetchPlaces(text, inputTypeStarting)
        }}
      />
      <Text style={styles.label}>Your destination</Text>
      <TextInput
        style={styles.input}
        placeholder="One Galle Face"
        value={secondInput}
        onChangeText={(text) => {
          setDirections(null)
          setSecondInput(text)
          fetchPlaces(text, inputTypeDestination)
        }}
      />
      {directions && <FlatList
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
      <FlatList
        data={places}
        keyExtractor={(item) => item.place_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listItem}
            onPress={
              () => handleItemPress(item.place_id, item.description)
            }
          >
            <Text>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

export default App;
