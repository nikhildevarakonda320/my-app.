import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";
import { Button, Form, Modal } from "react-bootstrap";
import { AgGridReact } from "ag-grid-react";
import { ClientSideRowModelModule } from "ag-grid-community";
import axios from "axios";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-community/styles/ag-theme-material.css";

const App = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newProfile, setNewProfile] = useState({ name: "", favoriteFood: "", favoriteColor: "" });
  const [editProfile, setEditProfile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Fix the API URL - remove 'https:' and use 'http:' instead
  const API_URL = "http://localhost:6000/api/profiles";

  const toggleDarkMode = () => setDarkMode(!darkMode);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    document.body.classList.toggle("light-mode", !darkMode);
  }, [darkMode]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const applyDarkStyles = () => {
        const rows = document.querySelectorAll('.ag-theme-material .ag-cell, .ag-header-cell, .ag-row, .ag-paging-panel');
        rows.forEach(el => {
          el.style.backgroundColor = darkMode ? '#444' : '';
          el.style.color = darkMode ? '#fff' : '';
        });
      };
      applyDarkStyles();
      const grid = document.querySelector('.ag-theme-material');
      const observer = new MutationObserver(applyDarkStyles);
      if (grid) observer.observe(grid, { childList: true, subtree: true });
      return () => observer.disconnect();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [darkMode]);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await axios.get(API_URL);
        setProfiles(res.data);
      } catch (err) {
        setError("Failed to load profiles");
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  const addProfile = async () => {
    if (!newProfile.name || !newProfile.favoriteFood || !newProfile.favoriteColor) return;
    try {
      const res = await axios.post(API_URL, newProfile);
      setProfiles([...profiles, { ...newProfile, id: res.data.id, likes: 0 }]);
      setNewProfile({ name: "", favoriteFood: "", favoriteColor: "" });
    } catch (error) {
      console.error("Error adding profile:", error);
    }
  };

  const deleteProfile = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setProfiles(profiles.filter(profile => profile.id !== id));
    } catch (error) {
      console.error("Error deleting profile:", error);
    }
  };

  const likeProfile = async (id) => {
    try {
      await axios.patch(`${API_URL}/${id}/likes`);
      setProfiles(profiles.map(profile =>
        profile.id === id ? { ...profile, likes: profile.likes + 1 } : profile
      ));
    } catch (error) {
      console.error("Error liking profile:", error);
    }
  };

  const handleEdit = (profile) => {
    setEditProfile({ ...profile });
    setShowModal(true);
  };

  const saveEdit = async () => {
    try {
      await axios.put(`${API_URL}/${editProfile.id}`, editProfile);
      setProfiles(profiles.map(profile =>
        profile.id === editProfile.id ? editProfile : profile
      ));
      setShowModal(false);
    } catch (error) {
      console.error("Error saving edit:", error);
    }
  };

  const ActionButtons = (params) => (
    <div className="action-buttons-container">
      <Button variant="success" size="sm" onClick={() => likeProfile(params.data.id)}>Like</Button>
      <Button variant="warning" size="sm" onClick={() => handleEdit(params.data)}>Edit</Button>
      <Button variant="danger" size="sm" onClick={() => deleteProfile(params.data.id)}>Delete</Button>
    </div>
  );

  const columnDefs = [
    { headerName: "Name", field: "name", sortable: true, filter: true },
    { headerName: "Favorite Food", field: "favoriteFood", sortable: true, filter: true },
    { headerName: "Favorite Color", field: "favoriteColor", sortable: true, filter: true },
    { headerName: "Likes", field: "likes", sortable: true },
    { headerName: "Actions", cellRenderer: ActionButtons }
  ];

  if (loading) return <div className="text-center mt-5">Loading profiles...</div>;
  if (error) return <div className="text-danger text-center mt-5">{error}</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mt-2">My Class Mates</h2>
        <Button variant={darkMode ? "light" : "dark"} onClick={toggleDarkMode}>
          {darkMode ? "Light Mode" : "Dark Mode"}
        </Button>
      </div>

      <Form className="mb-3">
        <Form.Group>
          <Form.Control type="text" placeholder="Name" value={newProfile.name}
            onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })} />
          <Form.Control type="text" placeholder="Favorite Food" className="mt-2"
            value={newProfile.favoriteFood}
            onChange={(e) => setNewProfile({ ...newProfile, favoriteFood: e.target.value })} />
          <Form.Control type="text" placeholder="Favorite Color" className="mt-2"
            value={newProfile.favoriteColor}
            onChange={(e) => setNewProfile({ ...newProfile, favoriteColor: e.target.value })} />
        </Form.Group>
        <Button variant="primary" className="mt-3"
          onClick={addProfile}
          disabled={!newProfile.name || !newProfile.favoriteFood || !newProfile.favoriteColor}>
          Add Profile
        </Button>
      </Form>

      <div className="ag-theme-material" style={{ height: "500px", width: "100%", borderRadius: "8px" }}>
        <AgGridReact
          rowData={profiles}
          columnDefs={columnDefs}
          modules={[ClientSideRowModelModule]}
          pagination={true}
          paginationPageSize={10}
          animateRows={true}
          rowSelection="multiple"
          defaultColDef={{
            flex: 1,
            minWidth: 100,
            resizable: true,
            sortable: true,
            filter: true,
          }}
          domLayout="normal"
          rowHeight={48}
          headerHeight={48}
        />
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Control type="text" placeholder="Name" value={editProfile?.name || ""}
              onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })} />
            <Form.Control type="text" placeholder="Favorite Food" className="mt-2"
              value={editProfile?.favoriteFood || ""}
              onChange={(e) => setEditProfile({ ...editProfile, favoriteFood: e.target.value })} />
            <Form.Control type="text" placeholder="Favorite Color" className="mt-2"
              value={editProfile?.favoriteColor || ""}
              onChange={(e) => setEditProfile({ ...editProfile, favoriteColor: e.target.value })} />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={saveEdit}
            disabled={!editProfile?.name || !editProfile?.favoriteFood || !editProfile?.favoriteColor}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default App;
