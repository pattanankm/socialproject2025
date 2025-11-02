import React from 'react'
import bobaLogo from '../assets/boba.png'

function Landing() {
  return (
    <div className="place-items-center border-2 rounded-xl">
      <img src={bobaLogo} className="w-40 m-3 rounded-sm" alt="" />
      <h3>Join today</h3>
      <a href="register" className='btn btn-primary rounded-pill m-2 mb-3 border-black border-2 bg-black w-50'>Register</a>
      <p className='text-xs'>By signing up, you agree to our Terms of Use and Privacy <br />Policy, including our use of cookies.</p><br />
      <p>Already have an account?</p>
      <a href="login" className='btn btn-success rounded-pill m-2 mb-3 border-secondary border-2 bg-white text-black w-50'>Login</a><br /><br />
    </div>
  )
}

export default Landing
