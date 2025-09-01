import java.awt.*;  
import java.applet.Applet;   
import java.util.Random; 

public class Fast_creep extends Creep
{
    public Fast_creep(int x, int y, int h, int s, int d) 
    {
		super(x, y, h, s, d);
	}	
		
	public Fast_creep(Creep copy, int d)
    {
    	super(copy, d);
    }
}