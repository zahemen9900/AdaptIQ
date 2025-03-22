import React, { useState } from 'react';
import './contactUs.css';

const ContactUs = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        areaOfInterest: '',
        streetAddress: '',
        city: '',
        state: '',
        zipCode: '',
        receiveComm: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        // Here you would typically send the data to your backend
    };

    return (
        <div className="contact-page">
            <div className="contact-header">
                <div className="contact-header-text">
                    <h1>Contact Us</h1>
                </div>
                <div className="contact-header-image">
                    <img
                        src="https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
                        alt="Students using AdaptIQ learning platform"
                    />
                </div>
            </div>
            
            <div className="contact-form-section">
                <div className="form-container">
                    <h2>Interested in learning more?</h2>
                    <p>Fill out this interest form to tell us a bit about yourself and we'll be in touch with more details.</p>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="firstName" 
                                    placeholder="First Name*" 
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="lastName" 
                                    placeholder="Last Name*" 
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <input 
                                    type="email" 
                                    name="email" 
                                    placeholder="Email Address*" 
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <select 
                                    name="areaOfInterest" 
                                    value={formData.areaOfInterest}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="" disabled>Area of Interest*</option>
                                    <option value="student">Student Learning</option>
                                    <option value="franchise">Franchise Opportunities</option>
                                    <option value="partnership">Partnership</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="streetAddress" 
                                    placeholder="Street Address" 
                                    value={formData.streetAddress}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="city" 
                                    placeholder="City" 
                                    value={formData.city}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <select 
                                    name="state" 
                                    value={formData.state}
                                    onChange={handleChange}
                                >
                                    <option value="" disabled>State</option>
                                    <option value="AL">Alabama</option>
                                    <option value="AK">Alaska</option>
                                    <option value="AZ">Arizona</option>
                                    <option value="AR">Arkansas</option>
                                    <option value="CA">California</option>
                                    <option value="CO">Colorado</option>
                                    <option value="CT">Connecticut</option>
                                    <option value="DE">Delaware</option>
                                    <option value="FL">Florida</option>
                                    <option value="GA">Georgia</option>
                                    <option value="HI">Hawaii</option>
                                    <option value="ID">Idaho</option>
                                    <option value="IL">Illinois</option>
                                    <option value="IN">Indiana</option>
                                    <option value="IA">Iowa</option>
                                    <option value="KS">Kansas</option>
                                    <option value="KY">Kentucky</option>
                                    <option value="LA">Louisiana</option>
                                    <option value="ME">Maine</option>
                                    <option value="MD">Maryland</option>
                                    <option value="MA">Massachusetts</option>
                                    <option value="MI">Michigan</option>
                                    <option value="MN">Minnesota</option>
                                    <option value="MS">Mississippi</option>
                                    <option value="MO">Missouri</option>
                                    <option value="MT">Montana</option>
                                    <option value="NE">Nebraska</option>
                                    <option value="NV">Nevada</option>
                                    <option value="NH">New Hampshire</option>
                                    <option value="NJ">New Jersey</option>
                                    <option value="NM">New Mexico</option>
                                    <option value="NY">New York</option>
                                    <option value="NC">North Carolina</option>
                                    <option value="ND">North Dakota</option>
                                    <option value="OH">Ohio</option>
                                    <option value="OK">Oklahoma</option>
                                    <option value="OR">Oregon</option>
                                    <option value="PA">Pennsylvania</option>
                                    <option value="RI">Rhode Island</option>
                                    <option value="SC">South Carolina</option>
                                    <option value="SD">South Dakota</option>
                                    <option value="TN">Tennessee</option>
                                    <option value="TX">Texas</option>
                                    <option value="UT">Utah</option>
                                    <option value="VT">Vermont</option>
                                    <option value="VA">Virginia</option>
                                    <option value="WA">Washington</option>
                                    <option value="WV">West Virginia</option>
                                    <option value="WI">Wisconsin</option>
                                    <option value="WY">Wyoming</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="zipCode" 
                                    placeholder="Zip Code" 
                                    value={formData.zipCode}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        
                        <div className="form-checkbox">
                            <input 
                                type="checkbox" 
                                id="receiveComm" 
                                name="receiveComm" 
                                checked={formData.receiveComm}
                                onChange={handleChange}
                            />
                            <label htmlFor="receiveComm">I'd like to receive communication from AdaptIQ AI.</label>
                        </div>
                        
                        <div className="form-submit">
                            <button type="submit">
                                SUBMIT
                                <span className="arrow-icon">→</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;