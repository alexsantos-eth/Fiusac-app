import React, { Component } from "react";
import { withRouter, Redirect } from 'react-router-dom';
import { auth } from "firebase/app";
import M from 'materialize-css/dist/js/materialize.min.js';
import './Navbar.css';
import Tutorial from '../Tutorial/Tutorial';
import CourseData from '../Calendar/courses.json';
import Floating from '../Floating/Floating';

class Navbar extends Component {
  constructor(props) {
    super(props);

    //Global Functions
    this.openSearch = this.openSearch.bind(this);
    this.closeTut = this.closeTut.bind(this);
    this.senEmail = this.senEmail.bind(this);
    this.state = { tut: false, redir: false, validUser: null, user: null }
    this.currentUser = "";

    //Set autocomplete data
    this.courses = {};
    CourseData.map(e => {
      if (e.nombre !== undefined && e.nombre.length > 2) this.courses[e.nombre.toLowerCase()] = null;
      if (e.catedratico !== undefined && e.catedratico.length > 2) this.courses[e.catedratico.toLowerCase()] = null;
      if (e.codigo !== undefined && e.codigo.length > 0) this.courses["Código " + e.codigo] = null;
      if (e.seccion !== undefined && e.seccion.length > 0) this.courses["Sección " + e.seccion] = null;
      if (e.edificio !== undefined && e.edificio.length > 0) this.courses["Edificio " + e.edificio] = null;
      if (e.salon !== undefined && e.salon.length > 0) this.courses["Salón " + e.salon + " del Edificio " + e.edificio] = null;
      if (e.horaInicio !== undefined && e.horaInicio.length > 0) this.courses["Empieza a las " + e.horaInicio + " termina a las " + e.horaFinal] = null;
      return 0
    });
  }

  //Send verify Email
  senEmail() {
    if (auth().currentUser !== null) {
      auth().currentUser.sendEmailVerification()
        .then(() => {
          M.toast({ html: 'Correo de verificación enviado' })
        })
        .catch(err => console.log(err))
    }
    this.setState({
      user: null
    })
  }

  //Close tutorial event
  closeTut() {
    const tuts = document.getElementById('tuto');
    const closeT = document.querySelector('.closeT');
    closeT.classList.add('hide');
    tuts.style.opacity = 0;
    closeT.style.opacity = 0;
    setTimeout(() => this.setState({ tut: false }), 300);
  };

  //Open search input
  openSearch() {
    //Select input field
    const cont = document.getElementById('search-container');
    const inp = document.getElementById('search-input');
    const shadow = document.getElementById('searchShadow');
    inp.value = '';
    cont.style.display = "block";
    shadow.style.display = "block";
    cont.style.opacity = 1;
    inp.style.display = "block";
    setTimeout(() => shadow.style.opacity = 1, 10);
    setTimeout(() => inp.setAttribute('placeholder', 'Buscar'), 200);
    inp.focus();
  }

  componentDidMount() {
    //Containers and animations
    const drop = document.querySelectorAll('.dropdown-trigger')
    const cont = document.getElementById('search-container');
    const searchInput = document.getElementById('search-input');
    const shadow = document.getElementById('searchShadow');
    const opTut = document.getElementById('opTut');
    const closeT = document.querySelector('.closeT');

    //Init autocomplete
    M.Dropdown.init(drop);
    M.Autocomplete.init(searchInput, { data: this.courses });

    //Hide search function
    function hideSearch() {
      searchInput.style.display = "none";
      searchInput.setAttribute('placeholder', '')
      shadow.style.opacity = 0;
      setTimeout(() => {
        cont.style.display = "none";
        shadow.style.display = "none";
      }, 200);
    }

    //Check for user
    auth().onAuthStateChanged(user => {
      setTimeout(() => {
        this.currentUser = user ? user.displayName : "Iniciar sesión";
        this.setState({
          user: user ? user : null,
          validUser: user ? user.emailVerified : false
        })
      }, 10);
    })

    //Listen for route changes
    this.props.history.listen(location => {
      const user = auth().currentUser ? auth().currentUser : null;
      if (user) {
        const creationTime = new Date(parseInt(user.metadata.a));
        const today = new Date();
        const diference = today - creationTime;

        if (diference > 1000 * 3600 * 24) {
          user.delete()
            .then(function () {
              M.toast({ html: 'Usuario borrado, lo sentimos' })
            })
            .catch(function (error) {
              console.log('Error deleting user:', error);
            });
        }
      }
      this.currentUser = user ? user.displayName : "Iniciar Sesión";
      this.setState({
        user: auth().currentUser ? auth().currentUser : null,
        validUser: auth().currentUser ? auth().currentUser.emailVerified : false
      })
    });

    //Search Events
    searchInput.addEventListener('focusout', () => hideSearch());
    searchInput.addEventListener('change', () => setTimeout(() => searchInput.value.length > 2 ? this.setState({ redir: `/buscar/${searchInput.value}` }) : false, 10));
    searchInput.addEventListener('search', () => hideSearch());

    //Open tutorial
    opTut.addEventListener('click', () => {
      this.setState({ tut: true });
      setTimeout(() => closeT.style.opacity = 1, 10);
    })
  }
  render() {
    //Update state to show tutorial
    const { location } = this.props
    const paths = location.pathname.substr(1);
    let tutComp = ' ';
    if (this.state.tut) tutComp = (<Tutorial />);

    return (
      <div>
        <nav>
          <a class="brand truncate" href="./"><span>{paths.includes("buscar") ? paths.substr(7) : paths === "" ? "inicio" : paths === "cuenta" ? this.currentUser : paths === "signin" ? "Registrarse" : paths}</span></a>
          <div class="nav-wrapper">
            <a data-target="side1" href="#menu" class="nbtn sidenav-trigger waves-effect">
              <i class="material-icons">menu</i>
            </a>
            <a class="nbtn right waves-effect dropdown-trigger" href="#menuDot" data-target='dropdown1'>
              <i class="material-icons">more_vert</i>
            </a>
            <a class="nbtn right waves-effect" href="#search" onClick={this.openSearch}>
              <i class="material-icons">search</i>
            </a>
            <div class="input-field" id="search-container">
              <input id="search-input" type="search" />

              <i class="material-icons" id="sendSearch">search</i>
              <i class="material-icons" id="backSearch">arrow_back</i>
            </div>
          </div>
          <div id="searchShadow"></div>
          <ul id='dropdown1' class='dropdown-content z-depth-3'>
            <li id="opTut"><a class="black-text waves-effect" href="#info">Información</a></li>
          </ul>
        </nav>
        <Floating icon="add" action={this.openSearch} />
        <i class={this.state.tut ? "material-icons closeT" : "hide closeT"} onClick={this.closeTut}>close</i>
        {tutComp}
        {this.state.user !== null ? this.state.validUser === false ? (
          <div id="verifyEmail">
            <span><i className="material-icons">info_outline</i> Te enviamos un correo de verificacion para que puedas seguir utilizando FIUSAC.app®.</span>
            <button className='waves-effect' onClick={this.senEmail}><i className="material-icons">send</i> Enviar correo de nuevo</button>
          </div>
        ) : '' : ''}
        {this.state.redir !== false ? <Redirect to={this.state.redir} /> : ''}
      </div>
    )
  }
}

export default withRouter(Navbar);