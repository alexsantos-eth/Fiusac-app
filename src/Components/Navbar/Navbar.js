import React, { Component } from "react";
import { withRouter, Redirect } from 'react-router-dom';
import ShowMsg from '../Alert/Alert';
import { auth } from "firebase/app";
import M from 'materialize-css/dist/js/materialize.min.js';
import './Navbar.css';
import Tutorial from '../Tutorial/Tutorial';
import CourseData from '../Calendar/courses.json';
import Floating from '../Floating/Floating';
import { UserTime, firedb, dataHandler } from '../../Functions';

const Alert = new ShowMsg();

class Navbar extends Component {
  constructor(props) {
    super(props);

    //Global Functions
    this.openSearch = this.openSearch.bind(this);
    this.closeTut = this.closeTut.bind(this);
    this.senEmail = this.senEmail.bind(this);
    this.shareCourses = this.shareCourses.bind(this);
    this.saveToCloud = this.saveToCloud.bind(this);
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

  saveToCloud() {
    const user = auth().currentUser ? auth().currentUser : null;
    dataHandler({}, 2).then(data => {
      if (user) {
        if (data.length === 0) {
          Alert.showMsg({
            title: "Sin cursos",
            body: "No tienes cursos agregados aun, puedes agregar mas cursos con el buscador.",
            type: "error"
          });
        }
        else {
          firedb.ref("users/" + user.uid + "/courses").set(data, () => {
            M.toast({ html: 'Cursos guardados exitosamente' });
          });
        }
      } else {
        Alert.showMsg({
          title: "Inicio de sesion",
          body: "Para poder acceder a estas opciones primero debes iniciar sesion en la aplicacion.",
          type: "error"
        });
      }
    })
  }

  shareCourses() {
    const user = auth().currentUser ? auth().currentUser : null;
    if (user) {
      Alert.showMsg({
        title: "Compartir cursos",
        body: `Tu codigo para compartir es <span>${user.uid}</span> para importar cursos de otras personas pega su codigo aqui:`,
        placeholder: 'Codigo para importar cursos',
        succesText: "Importar",
        type: "input",
        onConfirm: (value) => {
          firedb.ref("users/" + value).once('value', data => {
            setTimeout(() => {
              if (data.val()) {
                if (data.val().courses)
                  Alert.showMsg({
                    title: "Importar cursos",
                    body: `Importaras todos los cursos de ${data.val().name} <br/> tiene un total de cursos de: ${data.val().courses.length}.`,
                    type: "confirmation",
                    onConfirm: () => {
                      data.val().courses.map((e, i) => {
                        return dataHandler(e).then(item => {
                          if(i === data.val().courses.length - 1){
                            firedb.ref("users/"+user.uid+"/courses").set(item);
                          }
                        });
                      })
                      M.toast({ html: 'Cursos importados exitosamente' })
                    }
                  });
                else {
                  Alert.showMsg({
                    title: "Sin cursos",
                    body: "Lo sentimos pero no encontramos ningun curso asociado a esta cuenta.",
                    type: "error"
                  });
                }
              } else {
                Alert.showMsg({
                  title: "Codigo incorrecto",
                  body: "El codigo que introduciste no es correcto o no exite ninguna cuenta con ese codigo.",
                  type: "error"
                });
              }
            }, 300);
          })
        }
      });
    } else {
      Alert.showMsg({
        title: "Inicio de sesion",
        body: "Para poder acceder a estas opciones primero debes iniciar sesion en la aplicacion.",
        type: "error"
      });
    }
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
        if (user) {
          if (UserTime(user) === "new" && !user.photoURL) setTimeout(() => {
            firedb.ref("users/" + user.uid).update({ photo: "https://firebasestorage.googleapis.com/v0/b/fiusac.appspot.com/o/default.jpg?alt=media&token=deb24fd8-e895-466a-91ba-513fdfdfef3c" })
            console.log("Update photo for new user");
          }, 1000 * 60);
        }

        this.currentUser = user ? "" : "Iniciar sesión";
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
        if (UserTime(user) === "new") setTimeout(() => {
          firedb.ref("users/" + user.uid).update({ photo: "https://firebasestorage.googleapis.com/v0/b/fiusac.appspot.com/o/default.jpg?alt=media&token=deb24fd8-e895-466a-91ba-513fdfdfef3c" })
          console.log("Update photo for new user");
        }, 1000 * 60);
      }

      if (user && (user.emailVerified === false)) {
        if (UserTime(user) === "older") {
          user.delete()
            .then(function () {
              M.toast({ html: 'Usuario borrado, lo sentimos' })
            })
            .catch(function (error) {
              console.log('Error deleting user:', error);
            });
        }
      }
      this.currentUser = user ? "" : "Iniciar Sesión";
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
    let color;
    const pathsRes = paths.includes("buscar") ? paths.substr(7) : paths === "" ? "inicio" : paths === "cuenta" ? this.currentUser : paths === "signin" ? "Registrarse" : paths;
    let tutComp = ' ';
    if (this.state.tut) tutComp = (<Tutorial />);
    if (pathsRes === "") {
      if (this.state.user !== null && this.state.validUser === false) color = "blue";
      else color = "transBar";
    }


    return (
      <div>
        <nav className={color}>
          <a className="brand truncate" href="./"><span>{pathsRes === "" ? color === "blue" ? "Verificar correo" : "" : pathsRes}</span></a>
          <div className="nav-wrapper">
            <span data-target="side1" className="nbtn sidenav-trigger waves-effect">
              <i className="material-icons">menu</i>
            </span>
            <span className="nbtn right waves-effect dropdown-trigger" data-target='dropdown1'>
              <i className="material-icons">more_vert</i>
            </span>
            <span className="nbtn right waves-effect" onClick={this.openSearch}>
              <i className="material-icons">search</i>
            </span>
            <div className="input-field" id="search-container">
              <input id="search-input" type="search" />

              <i className="material-icons" id="sendSearch">search</i>
              <i className="material-icons" id="backSearch">arrow_back</i>
            </div>
          </div>
          <div id="searchShadow"></div>
          <ul id='dropdown1' className='dropdown-content z-depth-3'>
            <li id="opTut"><span className="black-text waves-effect">Información</span></li>
          </ul>
        </nav>
        <Floating icon="add" action={this.openSearch} cloud={this.saveToCloud} share={this.shareCourses} />
        <i className={this.state.tut ? "material-icons closeT" : "hide closeT"} onClick={this.closeTut}>close</i>
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