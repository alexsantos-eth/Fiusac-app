import React, { Component } from "react";
import { auth } from "firebase/app";
import { firebase } from "../../Functions.js";
import { Redirect } from 'react-router-dom';
import ShowMsg from '../Alert/Alert';
import * as firebaseui from 'firebaseui-es';
import M from "materialize-css/dist/js/materialize.min.js";
import './Login.css';

const uiConfig = {
    signInSuccessUrl: '/horario',
    signInFlow: 'popup',
    credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO,
    signInOptions: [
        // Leave the lines as is for the providers you want to offer your users.
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        {
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
            requireDisplayName: true,
            forceSameDevice: false,
            signInMethod: firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD
          }
    ]
};

const ui = new firebaseui.auth.AuthUI(firebase.auth());

class Login extends Component {
    constructor(props){
        super(props);
        this.state = { redir: false };
    }
    componentDidMount() {
        ui.start('#loginCont', uiConfig);
        const visible = document.querySelector('.visible');
        const pass = document.getElementById('pass');
        const forgotBtn = document.getElementById("forgot");
        let visibleToggle = true;

        //Hide and Show pass
        visible.addEventListener('click', ()=>{
            if(visibleToggle){
                pass.type = "text";
                visible.textContent = "visibility";
                visibleToggle = false;
            }
            else{
                pass.type = "password";
                visible.textContent = "visibility_off";
                visibleToggle = true;
            }
        })

        //Forgot password
        forgotBtn.addEventListener("click", () =>{
            Alert.showMsg({
                title: 'Recupera tu contraseña',
                body: 'Te enviaremos un mensaje a tu correo con un link para recuperar tu contraseña',
                type: "input",
                placeholder: "Correo electrónico",
                onConfirm: text => {
                    if(text.length > 5){
                        auth().sendPasswordResetEmail(text);
                        M.toast({ html: 'Mensaje enviado correctamente' })
                    }
                }
            })
        })

        //Show Alerts
        const Alert = new ShowMsg();
        
        const loginBtn = document.getElementById('loginBtn');
        loginBtn.addEventListener('click', () =>{
            const mail = document.getElementById('mail');
            auth().signInWithEmailAndPassword(mail.value, pass.value)
            .then(() =>{
                this.setState({redir:true});
                M.toast({ html: `Sesión iniciada correctamente` })
            })
            .catch(err => {
                const errType = err.code==="auth/invalid-email"?"El correo electrónico no es valido, verifica tu entrada o intenta de nuevo":err.code==="auth/wrong-password"?"El correo electrónico o la contraseña son incorrectos, verifica tu entrada.":err.message;
                Alert.showMsg({
                    title: 'Ocurrio un error', 
                    body: errType, 
                    type: "error"
                })
                console.log(err);
            });
        })
    }
    render() {
        return (
            <div id='logCont'>
                <div id="logBanner">
                    <h4>Saca el máximo provecho</h4>
                    <p>Tener una cuenta en la aplicación, tiene muchos beneficios, como notificaciones, grupos privados, y mas.</p>
                </div>
                <div id="logForm">
                    <h4>Explora las posibilidades</h4>
                    <p>Ingresa con tu correo y contraseña, si no tienes una cuenta puedes crear una con redes sociales.</p>
                    <div class="input-field col s6" id="emm">
                        <i class="material-icons prefix">account_circle</i>
                        <input id="mail" type="email" class="validate" />
                        <label for="mail">Correo</label>
                        <span class="helper-text" data-error="invalido" data-success="valido">Email de la cuenta</span>
                    </div>
                    <div class="input-field col s6">
                        <i class="material-icons prefix">lock</i>
                        <input id="pass" type="password" class="validate" />
                        <i className="material-icons visible">visibility_off</i>
                        <label for="pass">Contraseña</label>
                        <span class="helper-text" data-error="invalido" data-success="valido">Caracteres clave</span>
                        <a href="#forgotPassword" id="forgot">¿Has olvidado tu contraseña?</a>
                    </div>
                    <button id="loginBtn" className="waves-effect"><i className='material-icons'>email</i> Iniciar sesión</button>
                </div>
                <span id="logSep">o también</span>
                <div id="loginCont"></div>
                {this.state.redir !== false ? <Redirect to='/horario' /> : ''}
            </div>
        )
    }
}

export default Login;