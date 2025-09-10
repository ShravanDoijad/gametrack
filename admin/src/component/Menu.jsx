import React from 'react'
import { Link } from 'react-router-dom'

const Menu = () => {
  return (
    <div className='w-2/5 h-screen bg-gray-200 shadow-2xl '>
        <h1 className='text-4xl font-bold text-center mt-10'>Menu</h1>
        <ul className='mt-20 text-2xl font-semibold space-y-6
        flex flex-col items-center'>
            <li className='hover:text-lime-500 cursor-pointer'>Dashboard</li>
            <li className='hover:text-lime-500 cursor-pointer'>Add Turf</li>
            <li className='hover:text-lime-500 cursor-pointer'>Add Owner</li>
            <li className='hover:text-lime-500 cursor-pointer'>View Bookings</li>
            <li className='hover:text-lime-500 cursor-pointer'>Logout</li>
            <Link to={'/'}> login page</Link>
        </ul>


    </div>
  )
}

export default Menu