import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Authentications from './Pages/Authentication/Authentication';
import Home from './Pages/Home/Home';
import Profile from './Pages/Profile/Profile';
import CabinetAIPre from './Pages/CabinetAI/SetUp/CabinetAI-pre';
import BasicNavbar from './componements/navbar'
import 'bootstrap/dist/css/bootstrap.min.css';
import { Outlet } from 'react-router';
import { SharedDataProvider } from './componements/SharedDataProvider';
import CabinetAIPost from './Pages/CabinetAI/Reslut/CabinetAI-post';


function App() {
  return (
    <div className="App">
      <SharedDataProvider>
        <Routes>
          <Route path="/" element={<Authentications />} />
          <Route
            element={
              <>
                <BasicNavbar />
                <Outlet />
              </>
            }
          >
              <Route path='/home' element= {<Home />} />
              <Route path='/cabinetAI-pre' element={<CabinetAIPre />} />
              <Route path='/cabinetAI-post' element={<CabinetAIPost />} />
              <Route path='/profile' element={<Profile  />} />
          </Route>
        </Routes>
      </SharedDataProvider>
    </div>
  );
}

export default App;
