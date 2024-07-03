package com.example.bugsnag.reactnative.fragments.ui.react_native

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel

class ReactNativeViewModel : ViewModel() {

    private val _text = MutableLiveData<String>().apply {
        value = "This is react native Fragment"
    }
    val text: LiveData<String> = _text
}
