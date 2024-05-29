package com.example.bottomnavigationviews

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.os.bundleOf
import androidx.fragment.app.Fragment
import androidx.viewpager2.adapter.FragmentStateAdapter
import androidx.viewpager2.widget.ViewPager2
import com.example.bottomnavigationviews.databinding.ActivityMainBinding
import com.example.bottomnavigationviews.ui.home.HomeFragment
import com.example.bottomnavigationviews.ui.react_native.ReactNativeFragment
import com.facebook.react.ReactFragment
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import com.google.android.material.bottomnavigation.BottomNavigationView

class MainActivity : AppCompatActivity(), DefaultHardwareBackBtnHandler {

    private lateinit var binding: ActivityMainBinding

    private fun getLaunchOptions(message: String) = bundleOf("message" to message)

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
                    .setLaunchOptions(getLaunchOptions("test message"))
                    .build()
            )

            override fun getItemCount(): Int = 3
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
