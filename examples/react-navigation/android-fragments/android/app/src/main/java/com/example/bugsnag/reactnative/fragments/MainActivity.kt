package com.example.bugsnag.reactnative.fragments

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.viewpager2.adapter.FragmentStateAdapter
import androidx.viewpager2.widget.ViewPager2
import com.example.bugsnag.reactnative.fragments.databinding.ActivityMainBinding
import com.example.bugsnag.reactnative.fragments.ui.home.HomeFragment
import com.example.bugsnag.reactnative.fragments.ui.react_native.ReactNativeFragment
import com.facebook.react.ReactFragment
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import com.google.android.material.bottomnavigation.BottomNavigationView

class MainActivity : AppCompatActivity(), DefaultHardwareBackBtnHandler {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val navView: BottomNavigationView = binding.navView
        val pager: ViewPager2 = binding.pageHost

        pager.adapter = object : FragmentStateAdapter(this) {
            private val fragments = arrayOf(
                HomeFragment(),
                ReactNativeFragment(),
                // Put the ReactNative Fragment here!
                ReactFragment.Builder()
                    .setComponentName("BugsnagExampleApp")
                    .build()
            )

            override fun getItemCount(): Int = fragments.size
            override fun createFragment(position: Int): Fragment = fragments[position]
        }

        navView.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.navigation_home -> pager.currentItem = 0
                R.id.navigation_react_native -> pager.currentItem = 2
            }

            true
        }
    }

    override fun invokeDefaultOnBackPressed() {}
}
