package com.example.bottomnavigationviews.ui.home

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel

class HomeViewModel : ViewModel() {

    private val _text = MutableLiveData<String>().apply {
        value = "Use the navigation to navigate to the React Native app"
    }
    val text: LiveData<String> = _text
}