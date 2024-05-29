package com.example.bottomnavigationviews.ui.react_native

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import com.example.bottomnavigationviews.databinding.FragmentReactNativeBinding

class ReactNativeFragment : Fragment() {

    private var _binding: FragmentReactNativeBinding? = null

    // This property is only valid between onCreateView and
    // onDestroyView.
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val reactNativeViewModel =
            ViewModelProvider(this).get(ReactNativeViewModel::class.java)

        _binding = FragmentReactNativeBinding.inflate(inflater, container, false)
        val root: View = binding.root

        val textView: TextView = binding.textReactNative
        reactNativeViewModel.text.observe(viewLifecycleOwner) {
            textView.text = it
        }
        return root
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
